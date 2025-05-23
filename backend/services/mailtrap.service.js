// mailtrap.service.js

// Load environment variables from .env file
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Always resolve .env from the backend directory
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, '.env');
dotenv.config({ path: envPath });

import axios from 'axios';
import { getCurrentDateTime } from '../helpers/helper.js';

// -------------------------------------------------------------------
// Mailtrap Configuration (loaded directly from process.env)
// -------------------------------------------------------------------
const MAILTRAP_API_TOKEN = process.env.MAILTRAP_API_TOKEN;
const MAILTRAP_BASE_URL = process.env.MAILTRAP_BASE_URL; // e.g., "https://sandbox.api.mailtrap.io/api/send/3689529"
const SENDER = {
  email: process.env.MAILTRAP_SENDER_EMAIL,
  name: process.env.MAILTRAP_SENDER_NAME,
};

const EMAIL_TEMPLATE_IDS = {
  // Using one template ID for all email types in this example.
  verification_email: process.env.EMAIL_TEMPLATE_ID,
  // If you have additional templates, define them here.
};

// --- Safe parsing for EMAIL_TEMPLATE_VARIABLES ---
let EMAIL_TEMPLATE_VARIABLES = {};
try {
  if (process.env.EMAIL_TEMPLATE_VARIABLES) {
    EMAIL_TEMPLATE_VARIABLES = JSON.parse(process.env.EMAIL_TEMPLATE_VARIABLES);
  } else {
    console.warn('EMAIL_TEMPLATE_VARIABLES is undefined in environment. Using empty object.');
    EMAIL_TEMPLATE_VARIABLES = {};
  }
} catch (e) {
  console.error("Invalid EMAIL_TEMPLATE_VARIABLES in .env:", e.message);
  EMAIL_TEMPLATE_VARIABLES = {};
}

// -------------------------------------------------------------------
// Mailtrap Client
// -------------------------------------------------------------------
const mailtrapClient = {
  send: async (data) => {
    // Debug: Log the outgoing payload to verify dynamic data inclusion.
    console.log("Sending email payload to Mailtrap:", JSON.stringify(data, null, 2));
    try {
      const response = await axios({
        method: 'post',
        // Use the complete endpoint directly from MAILTRAP_BASE_URL.
        url: MAILTRAP_BASE_URL,
        data,
        headers: {
          'Authorization': `Bearer ${MAILTRAP_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
      });
      return response.data;
    } catch (error) {
      console.error(
        "Error in mailtrapClient.send:",
        error.response ? error.response.data : error.message
      );
      throw error;
    }
  },
};

// -------------------------------------------------------------------
// Email Sending Functions
// -------------------------------------------------------------------

/**
 * Sends a verification email with a verification code to the specified email address.
 * Called when a user signs up.
 *
 * @param {string} email - The recipient's email address.
 * @param {string} verificationCode - The verification code to include.
 * @returns {Promise<void>}
 */
export const sendVerificationEmail = async (email, verificationCode) => {
  const recipients = [{ email }];
  try {
    // Build the payload with dynamic variables.
    const payload = {
      from: SENDER,
      to: recipients,
      template_uuid: EMAIL_TEMPLATE_IDS.verification_email,
      template_variables: {
        ...EMAIL_TEMPLATE_VARIABLES,
        // Use 'verification_code' as the dynamic key.
        verification_code: verificationCode,
        signup_timestamp: getCurrentDateTime(),
      },
    };
    const response = await mailtrapClient.send(payload);
    console.log("Verification email sent successfully:", response);
  } catch (error) {
    console.error(
      "Error sending verification email:",
      error.response ? error.response.data : error.message
    );
    throw new Error(`Couldn't send verification email: ${error.message}`);
  }
};

/**
 * Sends a welcome email to the specified email address.
 * Called when a user successfully signs up.
 *
 * @param {string} email - The recipient's email address.
 * @param {string} name - The recipient's name.
 * @returns {Promise<void>}
 */
export const sendWelcomeEmail = async (email, name) => {
  const recipients = [{ email }];
  try {
    const payload = {
      from: SENDER,
      to: recipients,
      // Using the same template ID as verification for demonstration.
      template_uuid: EMAIL_TEMPLATE_IDS.verification_email,
      template_variables: {
        ...EMAIL_TEMPLATE_VARIABLES,
        name, // dynamic name to personalize the email.
      },
    };
    const response = await mailtrapClient.send(payload);
    console.log("Welcome email sent successfully:", response);
  } catch (error) {
    console.error(
      "Error sending welcome email:",
      error.response ? error.response.data : error.message
    );
    throw new Error(`Couldn't send welcome email: ${error.message}`);
  }
};

/**
 * Sends a password reset email to the specified address.
 * Called when a user requests a password reset.
 *
 * @param {string} email - The recipient's email address.
 * @param {string} url - The URL of the password reset page (with a unique token).
 * @returns {Promise<void>}
 */
export const sendPasswordResetEmail = async (email, url) => {
  const recipients = [{ email }];
  try {
    const payload = {
      from: SENDER,
      to: recipients,
      template_uuid: EMAIL_TEMPLATE_IDS.verification_email,
      template_variables: {
        ...EMAIL_TEMPLATE_VARIABLES,
        company_info_website_url: url,
        email,
        signup_timestamp: getCurrentDateTime(),
      },
    };
    const response = await mailtrapClient.send(payload);
    console.log("Password reset email sent successfully:", response);
  } catch (error) {
    console.error(
      "Error sending password reset email:",
      error.response ? error.response.data : error.message
    );
    throw new Error(`Couldn't send password reset email: ${error.message}`);
  }
};

/**
 * Sends a password reset success confirmation email to the specified address.
 * Called when a user successfully resets their password.
 *
 * @param {string} email - The recipient's email address.
 * @returns {Promise<void>}
 */
export const sendPasswordResetSuccessEmail = async (email) => {
  const recipients = [{ email }];
  try {
    const payload = {
      from: SENDER,
      to: recipients,
      template_uuid: EMAIL_TEMPLATE_IDS.verification_email,
      template_variables: {
        ...EMAIL_TEMPLATE_VARIABLES,
        email,
        confirmation_timestamp: getCurrentDateTime(),
      },
    };
    const response = await mailtrapClient.send(payload);
    console.log("Password reset confirmation email sent successfully:", response);
  } catch (error) {
    console.error(
      "Error sending password reset confirmation email:",
      error.response ? error.response.data : error.message
    );
    throw new Error(`Couldn't send password reset confirmation email: ${error.message}`);
  }
};
