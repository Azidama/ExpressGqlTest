import { config } from 'dotenv'
config({ path: `.env.${process.env.NODE_ENV || 'development'}.local` })

export const CREDENTIALS = process.env.CREDENTIALS === 'true'
export const { ENVIRONMENT, PORT, SECRET_KEY, LOG_FORMAT, LOG_DIR, ORIGIN } = process.env
export const { POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_HOST, POSTGRES_PORT, POSTGRES_DB } = process.env
export const { BREVO_API_KEY, BREVO_SENDER_EMAIL, STAFF_EMAIL } = process.env
export const { FRONTEND_URL, ADMIN_EMAIL, ADMIN_PASSWORD } = process.env
