"""
Email Service
Handles sending emails via SMTP
"""
import aiosmtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os
import logging

logger = logging.getLogger(__name__)

# Email Configuration
SMTP_HOST = os.environ.get('SMTP_HOST', 'smtp.gmail.com')
SMTP_PORT = int(os.environ.get('SMTP_PORT', 587))
SMTP_USER = os.environ.get('SMTP_USER', '')
SMTP_PASSWORD = os.environ.get('SMTP_PASSWORD', '')
EMAIL_FROM = os.environ.get('EMAIL_FROM', '')


async def send_email(to_email: str, subject: str, html_body: str) -> bool:
    """
    Send an email using SMTP
    
    Args:
        to_email: Recipient email address
        subject: Email subject
        html_body: HTML content of the email
    
    Returns:
        True if email sent successfully, False otherwise
    """
    if not SMTP_USER or not SMTP_PASSWORD:
        logger.warning("Email credentials not configured")
        return False
    
    try:
        message = MIMEMultipart("alternative")
        message["Subject"] = subject
        message["From"] = EMAIL_FROM or SMTP_USER
        message["To"] = to_email
        
        html_part = MIMEText(html_body, "html")
        message.attach(html_part)
        
        await aiosmtplib.send(
            message,
            hostname=SMTP_HOST,
            port=SMTP_PORT,
            username=SMTP_USER,
            password=SMTP_PASSWORD,
            start_tls=True
        )
        
        logger.info(f"Email sent successfully to {to_email}")
        return True
        
    except Exception as e:
        logger.error(f"Failed to send email to {to_email}: {str(e)}")
        return False


def get_welcome_email_template(name: str, email: str, password: str, role: str, school_name: str = None) -> str:
    """Generate welcome email HTML template"""
    school_info = f"<p><strong>School:</strong> {school_name}</p>" if school_name else ""
    
    return f"""
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
            .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
            .header {{ background: linear-gradient(135deg, #ec4899, #8b5cf6); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
            .content {{ background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }}
            .credentials {{ background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ec4899; }}
            .footer {{ text-align: center; margin-top: 30px; color: #666; font-size: 12px; }}
            .btn {{ display: inline-block; background: #ec4899; color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; margin-top: 20px; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🎓 Welcome to MySchool!</h1>
            </div>
            <div class="content">
                <p>Dear <strong>{name}</strong>,</p>
                <p>Your account has been created successfully as a <strong>{role}</strong>.</p>
                {school_info}
                <div class="credentials">
                    <h3>🔐 Your Login Credentials</h3>
                    <p><strong>Email:</strong> {email}</p>
                    <p><strong>Temporary Password:</strong> {password}</p>
                </div>
                <p>⚠️ <strong>Important:</strong> Please change your password after your first login for security purposes.</p>
                <center>
                    <a href="https://www.myschool.pub" class="btn">Login to MySchool</a>
                </center>
            </div>
            <div class="footer">
                <p>© 2024 MySchool. All rights reserved.</p>
                <p>If you didn't request this account, please ignore this email.</p>
            </div>
        </div>
    </body>
    </html>
    """


def get_password_reset_email_template(name: str, reset_code: str) -> str:
    """Generate password reset email HTML template"""
    return f"""
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
            .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
            .header {{ background: linear-gradient(135deg, #ec4899, #8b5cf6); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
            .content {{ background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }}
            .code-box {{ background: white; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center; border: 2px dashed #ec4899; }}
            .code {{ font-size: 32px; font-weight: bold; color: #ec4899; letter-spacing: 5px; }}
            .footer {{ text-align: center; margin-top: 30px; color: #666; font-size: 12px; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🔐 Password Reset Request</h1>
            </div>
            <div class="content">
                <p>Dear <strong>{name}</strong>,</p>
                <p>We received a request to reset your password. Use the code below to complete the process:</p>
                <div class="code-box">
                    <p class="code">{reset_code}</p>
                    <p style="color: #666; font-size: 12px;">This code expires in 10 minutes</p>
                </div>
                <p>If you didn't request this, please ignore this email or contact support if you have concerns.</p>
            </div>
            <div class="footer">
                <p>© 2024 MySchool. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
    """
