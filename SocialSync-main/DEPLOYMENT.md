# Deployment Guide for SocialSync

## Render.com Deployment

This project is configured to deploy on Render.com using the `render.yaml` file.

### Required Environment Variables

Set these environment variables in your Render dashboard:

#### Database
- `DATABASE_URL` - Your PostgreSQL connection string

#### Security
- `SESSION_SECRET` - A strong random string for session encryption

#### AWS S3 (Optional - for file uploads)
- `AWS_ACCESS_KEY_ID` - Your AWS access key
- `AWS_SECRET_ACCESS_KEY` - Your AWS secret key
- `AWS_REGION` - AWS region (e.g., us-east-1)
- `AWS_S3_BUCKET_NAME` - Your S3 bucket name

#### Google OAuth (Optional - for Google login)
- `GOOGLE_CLIENT_ID` - Google OAuth client ID
- `GOOGLE_CLIENT_SECRET` - Google OAuth client secret
- `GOOGLE_CALLBACK_URL` - Callback URL (e.g., https://your-domain.com/auth/google/callback)

#### Email (Optional - for email notifications)
- `EMAIL_HOST` - SMTP host (e.g., smtp.gmail.com)
- `EMAIL_PORT` - SMTP port (e.g., 587)
- `EMAIL_USER` - Email username
- `EMAIL_PASS` - Email password/app password
- `FROM_EMAIL` - From email address

#### Application
- `APP_URL` - Your application URL (e.g., https://your-domain.com)
- `NODE_ENV` - Set to "production"

### Deployment Steps

1. Connect your GitHub repository to Render
2. Render will automatically detect the `render.yaml` file
3. Set up the required environment variables in the Render dashboard
4. Deploy!

### Build Process

The deployment will:
1. Install dependencies with `npm install`
2. Build the application with `npm run build`
3. Start the server with `npm run start`

### Troubleshooting

If you encounter the "Could not read package.json" error:
- Make sure the `render.yaml` file is in the root directory of your repository
- Verify that the `package.json` file exists in the root directory
- Check that all environment variables are properly set

### Local Development

For local development:
1. Copy `.env.example` to `.env` (if it exists)
2. Set up your environment variables
3. Run `npm run dev` to start the development server 