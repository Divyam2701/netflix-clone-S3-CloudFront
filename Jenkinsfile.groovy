pipeline {
    agent any

   

    environment {
        AWS_REGION = 'us-west-1'
        ECR_REPO = '971937583465.dkr.ecr.us-west-1.amazonaws.com/netflix-clone'
        IMAGE_TAG = "${env.BUILD_NUMBER}"
        BACKEND_HOST = '52.53.175.254' // Your backend EC2 public IP or DNS
        BACKEND_SSH_KEY = credentials('backend-ec2-ssh-key')
    }

    stages {
        stage('Checkout') {
            steps {
                git branch: 'main', url: 'https://github.com/Divyam2701/netflix-clone-S3-CloudFront.git'
            }
        }
        stage('Build & Push Frontend Docker Image') {
            steps {
                dir('frontend') {
                    sh '''
                    aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $ECR_REPO
                    docker build -t $ECR_REPO:$IMAGE_TAG .
                    docker push $ECR_REPO:$IMAGE_TAG
                    '''
                }
            }
        }
        stage('Deploy Frontend to ECS') {
            steps {
                sh '''
                aws ecs update-service --cluster Netflix-clone --service netflix-clone-service-1 \
                  --force-new-deployment --region $AWS_REGION \
                  --desired-count 1 \
                  --output json

                # Update the service with the new image (forces new deployment with latest tag)
                aws ecs update-service --cluster Netflix-clone --service netflix-clone-service-1 \
                  --region $AWS_REGION \
                  --force-new-deployment \
                  --output json
                '''
            }
        }
        stage('Deploy Backend to EC2') {
            steps {
                sshagent(['backend-ec2-ssh-key']) {
                    sh '''
                    ssh -o StrictHostKeyChecking=no ubuntu@$BACKEND_HOST '
                        cd /home/ubuntu/netflix-clone-S3-CloudFront &&
                        git reset --hard &&
                        git clean -fd &&
                        git pull origin main &&
                        cd backend &&

                        echo "==== FULL .env FILE ====" &&
                        cat .env || echo ".env missing!" &&

                        npm install --production

                        # Load .env variables into environment for PM2 (optional: for inline env use)
                        set -a
                        [ -f .env ] && . .env
                        set +a

                        if pm2 list | grep -q "netflix-backend"; then
                            pm2 reload netflix-backend
                        else
                            pm2 start index.js --name "netflix-backend"
                        fi
                    '
                    '''
                }
            }
        }
    }
}