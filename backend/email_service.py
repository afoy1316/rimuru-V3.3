import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional
import logging

logger = logging.getLogger(__name__)

# Email configuration from environment
SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", 587))
SMTP_USER = os.getenv("SMTP_USER")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD")
EMAIL_FROM = os.getenv("EMAIL_FROM", "Rimuru Admin <rimuru.noreply@gmail.com>")

# Frontend URL for links in emails
FRONTEND_URL = "https://rimuru.id"

# Rimuru Logo URL (hosted publicly)
LOGO_URL = "https://customer-assets.emergentagent.com/job_fintech-rimuru/artifacts/xxp79cki_Logo%20Rimuru%20New.png"

class EmailService:
    """Email service using Gmail SMTP"""
    
    @staticmethod
    def send_email(
        to_email: str,
        subject: str,
        html_content: str,
        text_content: Optional[str] = None
    ) -> bool:
        """
        Send email using Gmail SMTP
        
        Args:
            to_email: Recipient email address
            subject: Email subject
            html_content: HTML content of the email
            text_content: Plain text fallback (optional)
        
        Returns:
            bool: True if email sent successfully, False otherwise
        """
        try:
            # Create message
            message = MIMEMultipart("alternative")
            message["From"] = EMAIL_FROM
            message["To"] = to_email
            message["Subject"] = subject
            
            # Add plain text version (fallback)
            if text_content:
                part1 = MIMEText(text_content, "plain")
                message.attach(part1)
            
            # Add HTML version
            part2 = MIMEText(html_content, "html")
            message.attach(part2)
            
            # Connect to Gmail SMTP server
            with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
                server.starttls()  # Secure connection
                server.login(SMTP_USER, SMTP_PASSWORD)
                server.send_message(message)
            
            logger.info(f"[SUCCESS] Email sent successfully to {to_email}")
            return True
            
        except Exception as e:
            logger.error(f"❌ Failed to send email to {to_email}: {e}")
            return False
    
    @staticmethod
    def send_welcome_client_email(user_email: str, user_name: str, username: str) -> bool:
        """Send welcome email to new client - Mailchimp/SendGrid style"""
        subject = "🎉 Selamat Datang di Rimuru - Akun Anda Telah Aktif!"
        
        html_content = f"""
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f4;">
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f4f4f4;">
        <tr>
            <td align="center" style="padding: 40px 0;">
                
                <!-- Container -->
                <table border="0" cellpadding="0" cellspacing="0" width="600" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                    
                    <!-- Header with Logo -->
                    <tr>
                        <td align="center" style="padding: 40px 40px 30px 40px; background-color: #667eea;">
                            <img src="{LOGO_URL}" alt="Rimuru" style="display: block; width: 120px; height: auto;" />
                        </td>
                    </tr>
                    
                    <!-- Main Title -->
                    <tr>
                        <td align="center" style="padding: 30px 40px 10px 40px;">
                            <h1 style="margin: 0; font-family: Arial, sans-serif; font-size: 28px; font-weight: bold; color: #333333;">
                                Selamat Datang di Rimuru!
                            </h1>
                        </td>
                    </tr>
                    
                    <!-- Greeting -->
                    <tr>
                        <td style="padding: 20px 40px;">
                            <p style="margin: 0; font-family: Arial, sans-serif; font-size: 16px; line-height: 24px; color: #333333;">
                                Halo <strong>{user_name}</strong>,
                            </p>
                            <p style="margin: 15px 0 0 0; font-family: Arial, sans-serif; font-size: 16px; line-height: 24px; color: #666666;">
                                Terima kasih telah bergabung dengan Rimuru! Akun Anda telah berhasil dibuat dan siap digunakan.
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Credential Box -->
                    <tr>
                        <td style="padding: 10px 40px 30px 40px;">
                            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f8f9fa; border-radius: 6px; border: 2px solid #e9ecef;">
                                <tr>
                                    <td style="padding: 25px; text-align: center;">
                                        <p style="margin: 0 0 10px 0; font-family: Arial, sans-serif; font-size: 14px; color: #666666; text-transform: uppercase; letter-spacing: 1px;">
                                            Username Anda
                                        </p>
                                        <p style="margin: 0; font-family: Arial, sans-serif; font-size: 24px; font-weight: bold; color: #667eea;">
                                            {username}
                                        </p>
                                        <p style="margin: 10px 0 0 0; font-family: Arial, sans-serif; font-size: 13px; color: #999999;">
                                            Gunakan username ini untuk login
                                        </p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    
                    <!-- Features Title -->
                    <tr>
                        <td style="padding: 10px 40px;">
                            <h2 style="margin: 0; font-family: Arial, sans-serif; font-size: 20px; font-weight: bold; color: #333333;">
                                Apa yang bisa Anda lakukan?
                            </h2>
                        </td>
                    </tr>
                    
                    <!-- Features List -->
                    <tr>
                        <td style="padding: 15px 40px;">
                            <table border="0" cellpadding="0" cellspacing="0" width="100%">
                                <tr>
                                    <td style="padding: 12px 0;">
                                        <table border="0" cellpadding="0" cellspacing="0" width="100%">
                                            <tr>
                                                <td width="40" valign="top">
                                                    <div style="width: 28px; height: 28px; background-color: #667eea; border-radius: 50%; color: #ffffff; text-align: center; line-height: 28px; font-family: Arial, sans-serif; font-weight: bold; font-size: 14px;">1</div>
                                                </td>
                                                <td valign="top">
                                                    <p style="margin: 0; font-family: Arial, sans-serif; font-size: 15px; font-weight: bold; color: #333333;">
                                                        Kelola Akun Iklan
                                                    </p>
                                                    <p style="margin: 5px 0 0 0; font-family: Arial, sans-serif; font-size: 14px; color: #666666; line-height: 20px;">
                                                        Tambahkan dan kelola akun Facebook, Google, dan TikTok Ads
                                                    </p>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                                
                                <tr>
                                    <td style="padding: 12px 0;">
                                        <table border="0" cellpadding="0" cellspacing="0" width="100%">
                                            <tr>
                                                <td width="40" valign="top">
                                                    <div style="width: 28px; height: 28px; background-color: #667eea; border-radius: 50%; color: #ffffff; text-align: center; line-height: 28px; font-family: Arial, sans-serif; font-weight: bold; font-size: 14px;">2</div>
                                                </td>
                                                <td valign="top">
                                                    <p style="margin: 0; font-family: Arial, sans-serif; font-size: 15px; font-weight: bold; color: #333333;">
                                                        Top-Up Saldo
                                                    </p>
                                                    <p style="margin: 5px 0 0 0; font-family: Arial, sans-serif; font-size: 14px; color: #666666; line-height: 20px;">
                                                        Isi saldo akun iklan Anda dengan mudah dan cepat
                                                    </p>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                                
                                <tr>
                                    <td style="padding: 12px 0;">
                                        <table border="0" cellpadding="0" cellspacing="0" width="100%">
                                            <tr>
                                                <td width="40" valign="top">
                                                    <div style="width: 28px; height: 28px; background-color: #667eea; border-radius: 50%; color: #ffffff; text-align: center; line-height: 28px; font-family: Arial, sans-serif; font-weight: bold; font-size: 14px;">3</div>
                                                </td>
                                                <td valign="top">
                                                    <p style="margin: 0; font-family: Arial, sans-serif; font-size: 15px; font-weight: bold; color: #333333;">
                                                        Monitor Transaksi
                                                    </p>
                                                    <p style="margin: 5px 0 0 0; font-family: Arial, sans-serif; font-size: 14px; color: #666666; line-height: 20px;">
                                                        Pantau riwayat transaksi secara real-time
                                                    </p>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                                
                                <tr>
                                    <td style="padding: 12px 0;">
                                        <table border="0" cellpadding="0" cellspacing="0" width="100%">
                                            <tr>
                                                <td width="40" valign="top">
                                                    <div style="width: 28px; height: 28px; background-color: #667eea; border-radius: 50%; color: #ffffff; text-align: center; line-height: 28px; font-family: Arial, sans-serif; font-weight: bold; font-size: 14px;">4</div>
                                                </td>
                                                <td valign="top">
                                                    <p style="margin: 0; font-family: Arial, sans-serif; font-size: 15px; font-weight: bold; color: #333333;">
                                                        Withdraw Saldo
                                                    </p>
                                                    <p style="margin: 5px 0 0 0; font-family: Arial, sans-serif; font-size: 14px; color: #666666; line-height: 20px;">
                                                        Tarik saldo dari akun iklan kapan saja
                                                    </p>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    
                    <!-- CTA Button -->
                    <tr>
                        <td align="center" style="padding: 30px 40px;">
                            <table border="0" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td align="center" style="border-radius: 50px; background-color: #667eea;">
                                        <a href="{FRONTEND_URL}" target="_blank" style="font-size: 16px; font-family: Arial, sans-serif; font-weight: bold; color: #ffffff; text-decoration: none; display: inline-block; padding: 14px 40px;">
                                            Mulai Sekarang &rarr;
                                        </a>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    
                    <!-- Tips Box -->
                    <tr>
                        <td style="padding: 0 40px 30px 40px;">
                            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #fffbeb; border-left: 4px solid #f59e0b; border-radius: 4px;">
                                <tr>
                                    <td style="padding: 15px 20px;">
                                        <p style="margin: 0; font-family: Arial, sans-serif; font-size: 14px; color: #92400e;">
                                            <strong>💡 Tips:</strong> Lengkapi profil Anda untuk memudahkan komunikasi dengan tim kami.
                                        </p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="padding: 30px 40px; background-color: #f8f9fa; border-top: 1px solid #e9ecef;">
                            <table border="0" cellpadding="0" cellspacing="0" width="100%">
                                <tr>
                                    <td align="center">
                                        <p style="margin: 0 0 10px 0; font-family: Arial, sans-serif; font-size: 16px; font-weight: bold; color: #333333;">
                                            Butuh Bantuan?
                                        </p>
                                        <p style="margin: 0 0 5px 0; font-family: Arial, sans-serif; font-size: 14px; color: #666666;">
                                            Tim support kami siap membantu Anda
                                        </p>
                                        <p style="margin: 15px 0 5px 0; font-family: Arial, sans-serif; font-size: 14px; color: #666666;">
                                            Email: rimuru.noreply@gmail.com
                                        </p>
                                        <p style="margin: 5px 0 0 0; font-family: Arial, sans-serif; font-size: 14px; color: #666666;">
                                            Website: <a href="{FRONTEND_URL}" style="color: #667eea; text-decoration: none;">{FRONTEND_URL}</a>
                                        </p>
                                        <p style="margin: 20px 0 0 0; font-family: Arial, sans-serif; font-size: 12px; color: #999999;">
                                            (c) 2025 Rimuru. All rights reserved.
                                        </p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    
                </table>
                
            </td>
        </tr>
    </table>
</body>
</html>
        """
        
        text_content = f"""
Selamat Datang di Rimuru!

Halo {user_name},

Terima kasih telah bergabung dengan Rimuru! Akun Anda telah berhasil dibuat.

Username Anda: {username}

Apa yang bisa Anda lakukan?
1. Kelola Akun Iklan - Tambahkan dan kelola akun Facebook, Google, dan TikTok Ads
2. Top-Up Saldo - Isi saldo akun iklan Anda dengan mudah
3. Monitor Transaksi - Pantau riwayat transaksi real-time
4. Withdraw Saldo - Tarik saldo dari akun iklan kapan saja

Mulai sekarang: {FRONTEND_URL}

Butuh bantuan?
Email: rimuru.noreply@gmail.com
Website: {FRONTEND_URL}

(c) 2025 Rimuru. All rights reserved.
        """
        
        return EmailService.send_email(user_email, subject, html_content, text_content)
        
        html_content = f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body {{
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #2d3748;
            margin: 0;
            padding: 0;
            background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
        }}
        .container {{
            max-width: 600px;
            margin: 30px auto;
            background: #ffffff;
            border-radius: 20px;
            overflow: hidden;
            box-shadow: 0 20px 60px rgba(0,0,0,0.15);
        }}
        .header {{
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 50px 30px;
            text-align: center;
            position: relative;
        }}
        .header::before {{
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320"><path fill="rgba(255,255,255,0.1)" d="M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,112C672,96,768,96,864,112C960,128,1056,160,1152,160C1248,160,1344,128,1392,112L1440,96L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path></svg>') bottom center no-repeat;
            background-size: 100% 50%;
            opacity: 0.3;
        }}
        .logo {{
            position: relative;
            z-index: 1;
            max-width: 140px;
            height: auto;
            margin: 0 auto 20px;
            filter: drop-shadow(0 4px 8px rgba(0,0,0,0.2));
        }}
        .header h1 {{
            position: relative;
            z-index: 1;
            margin: 0;
            font-size: 32px;
            font-weight: 700;
            color: white;
            text-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }}
        .content {{
            padding: 50px 40px;
        }}
        .greeting {{
            font-size: 20px;
            font-weight: 600;
            color: #1a202c;
            margin-bottom: 15px;
        }}
        .welcome-box {{
            background: linear-gradient(135deg, #f0f4ff 0%, #e8efff 100%);
            border-left: 5px solid #667eea;
            padding: 25px;
            margin: 30px 0;
            border-radius: 12px;
            box-shadow: 0 4px 15px rgba(102,126,234,0.1);
        }}
        .welcome-box p {{
            margin: 0;
            color: #4a5568;
            line-height: 1.8;
        }}
        .credential-box {{
            background: linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%);
            border: 3px solid #fb923c;
            padding: 30px;
            margin: 30px 0;
            border-radius: 16px;
            text-align: center;
            box-shadow: 0 8px 25px rgba(251,146,60,0.15);
        }}
        .credential-label {{
            color: #9a3412;
            font-size: 14px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 10px;
        }}
        .credential-value {{
            font-size: 28px;
            font-weight: 800;
            color: #ea580c;
            margin: 15px 0;
            letter-spacing: 1px;
        }}
        .credential-note {{
            color: #78350f;
            font-size: 13px;
            margin-top: 10px;
        }}
        .features {{
            margin: 40px 0;
        }}
        .feature-title {{
            color: #667eea;
            font-size: 20px;
            font-weight: 700;
            margin-bottom: 25px;
        }}
        .feature-item {{
            display: flex;
            align-items: start;
            margin: 20px 0;
            padding: 15px;
            background: #f8fafc;
            border-radius: 12px;
            transition: transform 0.2s;
        }}
        .feature-icon {{
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            width: 40px;
            height: 40px;
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-right: 15px;
            flex-shrink: 0;
            font-weight: 700;
            font-size: 18px;
            box-shadow: 0 4px 12px rgba(102,126,234,0.3);
        }}
        .feature-content strong {{
            color: #1e293b;
            display: block;
            margin-bottom: 5px;
        }}
        .feature-content span {{
            color: #64748b;
            font-size: 14px;
        }}
        .cta-section {{
            text-align: center;
            margin: 45px 0;
        }}
        .cta-button {{
            display: inline-block;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 18px 50px;
            text-decoration: none;
            border-radius: 50px;
            font-weight: 700;
            font-size: 16px;
            box-shadow: 0 10px 30px rgba(102,126,234,0.4);
            transition: all 0.3s ease;
        }}
        .cta-button:hover {{
            transform: translateY(-2px);
            box-shadow: 0 15px 40px rgba(102,126,234,0.5);
        }}
        .tip-box {{
            background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
            border-left: 5px solid #f59e0b;
            padding: 20px 25px;
            margin: 30px 0;
            border-radius: 12px;
        }}
        .tip-box strong {{
            color: #92400e;
        }}
        .tip-box p {{
            margin: 5px 0 0 0;
            color: #78350f;
        }}
        .footer {{
            background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
            padding: 40px 30px;
            text-align: center;
            color: #cbd5e1;
        }}
        .footer-title {{
            color: white;
            font-weight: 700;
            font-size: 16px;
            margin-bottom: 15px;
        }}
        .footer-contact {{
            margin: 15px 0;
            font-size: 14px;
        }}
        .footer-contact a {{
            color: #93c5fd;
            text-decoration: none;
            transition: color 0.3s;
        }}
        .footer-contact a:hover {{
            color: #60a5fa;
        }}
        .footer-legal {{
            margin-top: 25px;
            padding-top: 20px;
            border-top: 1px solid rgba(255,255,255,0.1);
            font-size: 12px;
            color: #94a3b8;
        }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <img src="{LOGO_URL}" alt="Rimuru Logo" class="logo" />
            <h1>Selamat Datang di Rimuru!</h1>
        </div>
        
        <div class="content">
            <p class="greeting">Halo {user_name},</p>
            
            <div class="welcome-box">
                <p>
                    Selamat! Akun Anda telah berhasil dibuat dan siap digunakan. 
                    Kami sangat senang Anda bergabung dengan <strong>Rimuru</strong> - platform manajemen iklan digital terpercaya Anda.
                </p>
            </div>
            
            <div class="credential-box">
                <p class="credential-label">Username Anda</p>
                <div class="credential-value">{username}</div>
                <p class="credential-note">Simpan username ini untuk login ke aplikasi</p>
            </div>
            
            <div class="features">
                <h3 class="feature-title">✨ Apa yang bisa Anda lakukan?</h3>
                
                <div class="feature-item">
                    <div class="feature-icon">1</div>
                    <div class="feature-content">
                        <strong>Kelola Akun Iklan</strong>
                        <span>Tambahkan dan kelola akun Facebook Ads, Google Ads, dan TikTok Ads Anda</span>
                    </div>
                </div>
                
                <div class="feature-item">
                    <div class="feature-icon">2</div>
                    <div class="feature-content">
                        <strong>Top-Up Saldo</strong>
                        <span>Isi saldo akun iklan Anda dengan mudah dan cepat</span>
                    </div>
                </div>
                
                <div class="feature-item">
                    <div class="feature-icon">3</div>
                    <div class="feature-content">
                        <strong>Monitor Transaksi</strong>
                        <span>Pantau semua transaksi dan riwayat top-up Anda secara real-time</span>
                    </div>
                </div>
                
                <div class="feature-item">
                    <div class="feature-icon">4</div>
                    <div class="feature-content">
                        <strong>Withdraw Saldo</strong>
                        <span>Tarik saldo dari akun iklan Anda kapan saja</span>
                    </div>
                </div>
            </div>
            
            <div class="cta-section">
                <a href="{FRONTEND_URL}" class="cta-button">🚀 Mulai Sekarang</a>
            </div>
            
            <div class="tip-box">
                <strong>💡 Tips:</strong>
                <p>Lengkapi profil Anda dan tambahkan informasi kontak untuk memudahkan komunikasi dengan tim kami.</p>
            </div>
        </div>
        
        <div class="footer">
            <p class="footer-title">Butuh bantuan?</p>
            <p>Tim support kami siap membantu Anda 24/7</p>
            <div class="footer-contact">
                <p>Email: Email: rimuru.noreply@gmail.com</p>
                <p>Website: Website: <a href="{FRONTEND_URL}">{FRONTEND_URL}</a></p>
            </div>
            <div class="footer-legal">
                <p>(c) 2025 Rimuru. All rights reserved.</p>
                <p>Email ini dikirim secara otomatis, mohon tidak membalas email ini.</p>
            </div>
        </div>
    </div>
</body>
</html>
        """
        
        text_content = f"""
Selamat Datang di Rimuru!

Halo {user_name},

Akun Anda telah berhasil dibuat dengan username: {username}

Anda sekarang dapat:
- Kelola akun iklan (Facebook Ads, Google Ads, TikTok Ads)
- Top-up saldo akun iklan
- Monitor transaksi real-time
- Withdraw saldo

Mulai sekarang di {FRONTEND_URL}

Butuh bantuan? Hubungi kami di rimuru.noreply@gmail.com

Salam,
Tim Rimuru
        """
        
        return EmailService.send_email(user_email, subject, html_content, text_content)
    
    @staticmethod
    def send_welcome_admin_email(admin_email: str, admin_name: str, username: str, is_super_admin: bool = False) -> bool:
        """Send welcome email to new admin"""
        role = "Super Admin" if is_super_admin else "Admin"
        subject = f"🎯 Selamat! Anda Telah Ditambahkan Sebagai {role} Rimuru"
        
        html_content = f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body {{
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
            background-color: #f4f4f4;
        }}
        .container {{
            max-width: 600px;
            margin: 20px auto;
            background: #ffffff;
            border-radius: 10px;
            overflow: hidden;
            box-shadow: 0 0 20px rgba(0,0,0,0.1);
        }}
        .header {{
            background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
            padding: 40px 20px;
            text-align: center;
            color: white;
        }}
        .header h1 {{
            margin: 0;
            font-size: 28px;
            font-weight: 600;
        }}
        .badge {{
            display: inline-block;
            background: rgba(255,255,255,0.3);
            padding: 5px 15px;
            border-radius: 20px;
            margin-top: 10px;
            font-size: 14px;
        }}
        .content {{
            padding: 40px 30px;
        }}
        .role-box {{
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 25px;
            border-radius: 10px;
            text-align: center;
            margin: 20px 0;
        }}
        .role-box h2 {{
            margin: 0 0 10px 0;
            font-size: 24px;
        }}
        .credential-box {{
            background: #fff5e6;
            border: 2px dashed #ff9800;
            padding: 20px;
            margin: 20px 0;
            border-radius: 8px;
            text-align: center;
        }}
        .permissions {{
            margin: 30px 0;
        }}
        .permission-item {{
            display: flex;
            align-items: center;
            margin: 12px 0;
            padding: 12px;
            background: #f8f9ff;
            border-radius: 8px;
        }}
        .permission-icon {{
            background: #4caf50;
            color: white;
            width: 24px;
            height: 24px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-right: 12px;
            font-size: 14px;
        }}
        .cta-button {{
            display: inline-block;
            background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
            color: white;
            padding: 15px 40px;
            text-decoration: none;
            border-radius: 25px;
            margin: 20px 0;
            font-weight: 600;
        }}
        .footer {{
            background: #f8f9fa;
            padding: 30px;
            text-align: center;
            color: #666;
            font-size: 14px;
        }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <img src="https://customer-assets.emergentagent.com/job_fintech-rimuru/artifacts/xxp79cki_Logo%20Rimuru%20New.png" alt="Rimuru Logo" style="max-width: 120px; height: auto; margin-bottom: 15px;" />
            <h1>🎯 Selamat Bergabung!</h1>
            <div class="badge">{"⭐ " if is_super_admin else ""}ADMIN TEAM</div>
        </div>
        
        <div class="content">
            <p style="font-size: 18px;"><strong>Halo {admin_name},</strong></p>
            
            <div class="role-box">
                <h2>{"👑" if is_super_admin else "🛡️"} {role}</h2>
                <p style="margin: 0; opacity: 0.9;">Anda telah ditambahkan ke Tim Admin Rimuru</p>
            </div>
            
            <p>
                Kami dengan senang hati menyambut Anda sebagai bagian dari tim admin Rimuru. 
                Anda sekarang memiliki akses untuk mengelola platform dan membantu klien kami.
            </p>
            
            <div class="credential-box">
                <p style="margin: 10px 0;"><strong>Username Admin Anda:</strong></p>
                <p style="font-size: 24px; margin: 10px 0; color: #f5576c;"><strong>{username}</strong></p>
                <p style="margin: 10px 0; font-size: 12px; color: #666;">
                    Gunakan username ini untuk login ke Admin Panel
                </p>
            </div>
            
            <h3 style="color: #f5576c; margin-top: 30px;">🔒 Akses & Permissions:</h3>
            
            <div class="permissions">
                <div class="permission-item">
                    <div class="permission-icon">✓</div>
                    <div><strong>Kelola Top-Up Requests</strong> - Approve/reject permintaan top-up dari klien</div>
                </div>
                
                <div class="permission-item">
                    <div class="permission-icon">✓</div>
                    <div><strong>Kelola Withdraw Requests</strong> - Proses permintaan penarikan saldo</div>
                </div>
                
                <div class="permission-item">
                    <div class="permission-icon">✓</div>
                    <div><strong>Manajemen Klien</strong> - Lihat dan kelola data klien</div>
                </div>
                
                <div class="permission-item">
                    <div class="permission-icon">✓</div>
                    <div><strong>Laporan Keuangan</strong> - Akses laporan transaksi lengkap</div>
                </div>
                
                {"<div class='permission-item'><div class='permission-icon'>⭐</div><div><strong>Super Admin Access</strong> - Kelola admin lain dan akses penuh sistem</div></div>" if is_super_admin else ""}
            </div>
            
            <div style="text-align: center; margin: 40px 0;">
                <a href="https://rimuru.id" class="cta-button">🚀 Login ke Admin Panel</a>
            </div>
            
            <div style="background: #e3f2fd; border-left: 4px solid #2196f3; padding: 15px; margin: 20px 0; border-radius: 5px;">
                <strong>📌 Penting:</strong> Jaga kerahasiaan credential Anda. Jangan bagikan username dan password kepada siapapun.
            </div>
        </div>
        
        <div class="footer">
            <p><strong>Butuh bantuan?</strong></p>
            <p>Hubungi Super Admin atau tim support kami</p>
            <p style="margin: 10px 0;">
                Email: Email: rimuru.noreply@gmail.com
            </p>
            <p style="margin-top: 20px; font-size: 12px; color: #999;">
                (c) 2025 Rimuru Admin Panel. All rights reserved.
            </p>
        </div>
    </div>
</body>
</html>
        """
        
        text_content = f"""
Selamat Bergabung di Tim Admin Rimuru!

Halo {admin_name},

Anda telah ditambahkan sebagai {role} di platform Rimuru.

Username Admin: {username}

Akses Anda:
- Kelola top-up requests
- Kelola withdraw requests
- Manajemen klien
- Laporan keuangan
{"- Super admin access (kelola admin lain)" if is_super_admin else ""}

Login sekarang di Admin Panel Rimuru!

PENTING: Jaga kerahasiaan credential Anda.

Salam,
Tim Rimuru
        """
        
        return EmailService.send_email(admin_email, subject, html_content, text_content)
    
    @staticmethod
    def send_notification_email(
        to_email: str,
        title: str,
        message: str,
        notification_type: str = "info"
    ) -> bool:
        """
        Send notification email
        
        Args:
            to_email: Recipient email
            title: Notification title
            message: Notification message
            notification_type: Type of notification (success, info, warning, error)
        """
        
        # Set colors and icons based on type
        type_config = {
            "success": {"color": "#4caf50", "icon": "[SUCCESS]", "bg": "#e8f5e9"},
            "info": {"color": "#2196f3", "icon": "ℹ️", "bg": "#e3f2fd"},
            "warning": {"color": "#ff9800", "icon": "[WARNING]", "bg": "#fff3e0"},
            "error": {"color": "#f44336", "icon": "❌", "bg": "#ffebee"}
        }
        
        config = type_config.get(notification_type, type_config["info"])
        
        subject = f"{config['icon']} {title}"
        
        html_content = f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body {{
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
        }}
        .container {{
            max-width: 600px;
            margin: 20px auto;
            background: #ffffff;
            border-radius: 10px;
            overflow: hidden;
            box-shadow: 0 0 20px rgba(0,0,0,0.1);
        }}
        .header {{
            background: {config['color']};
            padding: 30px 20px;
            text-align: center;
            color: white;
        }}
        .content {{
            padding: 30px;
        }}
        .notification-box {{
            background: {config['bg']};
            border-left: 4px solid {config['color']};
            padding: 20px;
            margin: 20px 0;
            border-radius: 5px;
        }}
        .footer {{
            background: #f8f9fa;
            padding: 20px;
            text-align: center;
            color: #666;
            font-size: 14px;
        }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <img src="https://customer-assets.emergentagent.com/job_fintech-rimuru/artifacts/xxp79cki_Logo%20Rimuru%20New.png" alt="Rimuru Logo" style="max-width: 120px; height: auto; margin-bottom: 15px;" />
            <h1 style="margin: 0; font-size: 24px;">{config['icon']} {title}</h1>
        </div>
        
        <div class="content">
            <div class="notification-box">
                <p style="margin: 0; white-space: pre-line;">{message}</p>
            </div>
            
            <p style="color: #666; font-size: 14px;">
                Login ke aplikasi Rimuru untuk melihat detail lebih lanjut.
            </p>
        </div>
        
        <div class="footer">
            <p>(c) 2025 Rimuru. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
        """
        
        text_content = f"""
{title}

{message}

Login ke aplikasi Rimuru untuk melihat detail lebih lanjut.

---
(c) 2025 Rimuru
        """
        
        return EmailService.send_email(to_email, subject, html_content, text_content)


# Convenience functions
def send_welcome_client_email(user_email: str, user_name: str, username: str) -> bool:
    """Send welcome email to new client"""
    return EmailService.send_welcome_client_email(user_email, user_name, username)

def send_welcome_admin_email(admin_email: str, admin_name: str, username: str, is_super_admin: bool = False) -> bool:
    """Send welcome email to new admin"""
    return EmailService.send_welcome_admin_email(admin_email, admin_name, username, is_super_admin)

def send_notification_email(to_email: str, title: str, message: str, notification_type: str = "info") -> bool:
    """Send notification email"""
    return EmailService.send_notification_email(to_email, title, message, notification_type)


# ============================================
# ADMIN NOTIFICATION EMAILS
# ============================================

def send_admin_new_client_email(admin_emails: list, client_name: str, client_username: str, client_email: str) -> bool:
    """Send email to all admins when new client registers"""
    if not admin_emails:
        return False
    
    subject = "🎉 Client Baru Mendaftar di Rimuru"
    
    html_content = f"""
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f4; font-family: 'Helvetica Neue', Arial, sans-serif;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <!-- Header with Logo -->
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; text-align: center;">
            <img src="{LOGO_URL}" alt="Rimuru" style="width: 120px; height: auto; display: block; margin: 0 auto;" />
        </div>
        
        <!-- Main Content -->
        <div style="padding: 40px 30px;">
            <!-- Success Icon -->
            <div style="text-align: center; margin-bottom: 30px;">
                <div style="background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%); width: 80px; height: 80px; border-radius: 50%; margin: 0 auto; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 15px rgba(76, 175, 80, 0.3);">
                    <span style="font-size: 40px;">🎉</span>
                </div>
            </div>
            
            <h1 style="color: #333; font-size: 28px; font-weight: 700; margin: 0 0 20px; text-align: center;">
                Client Baru Mendaftar!
            </h1>
            
            <p style="color: #666; font-size: 16px; line-height: 1.6; margin: 0 0 25px; text-align: center;">
                Selamat! Seorang client baru telah mendaftar di platform Rimuru
            </p>
            
            <!-- Client Details Card -->
            <div style="background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%); border-left: 4px solid #2196F3; border-radius: 8px; padding: 25px; margin: 25px 0;">
                <h3 style="color: #1976d2; font-size: 16px; font-weight: 600; margin: 0 0 15px;">👤 Detail Client</h3>
                <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                        <td style="padding: 8px 0; color: #666; font-size: 14px;">
                            <strong style="color: #333;">Nama Lengkap:</strong>
                        </td>
                        <td style="padding: 8px 0; color: #333; font-size: 14px; text-align: right;">
                            <strong>{client_name}</strong>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; color: #666; font-size: 14px;">
                            <strong style="color: #333;">Username:</strong>
                        </td>
                        <td style="padding: 8px 0; color: #333; font-size: 14px; text-align: right;">
                            <strong>@{client_username}</strong>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; color: #666; font-size: 14px;">
                            <strong style="color: #333;">Email:</strong>
                        </td>
                        <td style="padding: 8px 0; color: #333; font-size: 14px; text-align: right;">
                            <strong>{client_email}</strong>
                        </td>
                    </tr>
                </table>
            </div>
            
            <!-- Action Required -->
            <div style="background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%); border-radius: 12px; padding: 20px; margin: 25px 0; border-left: 4px solid #4CAF50;">
                <p style="margin: 0; color: #2e7d32; font-size: 15px; line-height: 1.6;">
                    <strong>✨ Client Baru Siap!</strong><br>
                    <span style="color: #666; font-size: 14px;">Pastikan memberikan support terbaik untuk client baru ini</span>
                </p>
            </div>
            
            <!-- CTA Button -->
            <div style="text-align: center; margin: 35px 0;">
                <a href="{FRONTEND_URL}/admin/clients" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 15px 40px; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);">
                    📊 Lihat Detail Client
                </a>
            </div>
        </div>
        
        <!-- Footer -->
        <div style="background: #f8f9fa; padding: 30px; text-align: center; color: #666;">
            <p style="margin: 5px 0; font-weight: 600; color: #333;">Rimuru Admin System 🔧</p>
            <p style="margin: 5px 0; font-size: 13px;">© 2025 Rimuru. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
    """
    
    # Send to all admin emails
    success_count = 0
    for admin_email in admin_emails:
        if EmailService.send_email(admin_email, subject, html_content):
            success_count += 1
    
    logger.info(f"📧 New client notification emails sent to {success_count}/{len(admin_emails)} admins")
    return success_count > 0


def send_admin_new_topup_request_email(admin_emails: list, client_name: str, amount: float, currency: str, platform: str, account_name: str) -> bool:
    """Send email to all admins when new top-up request is created"""
    if not admin_emails:
        return False
    
    currency_symbol = "Rp" if currency == "IDR" else "$"
    formatted_amount = f"{currency_symbol} {amount:,.0f}"
    
    subject = f"💰 Permintaan Top-Up Baru - {formatted_amount}"
    
    html_content = f"""
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f4; font-family: 'Helvetica Neue', Arial, sans-serif;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <!-- Header with Logo -->
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; text-align: center;">
            <img src="{LOGO_URL}" alt="Rimuru" style="width: 120px; height: auto; display: block; margin: 0 auto;" />
        </div>
        
        <!-- Main Content -->
        <div style="padding: 40px 30px;">
            <!-- Alert Icon -->
            <div style="text-align: center; margin-bottom: 30px;">
                <div style="background: linear-gradient(135deg, #ff9800 0%, #f57c00 100%); width: 80px; height: 80px; border-radius: 50%; margin: 0 auto; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 15px rgba(255, 152, 0, 0.3);">
                    <span style="font-size: 40px;">💰</span>
                </div>
            </div>
            
            <h1 style="color: #333; font-size: 28px; font-weight: 700; margin: 0 0 20px; text-align: center;">
                Permintaan Top-Up Baru!
            </h1>
            
            <p style="color: #666; font-size: 16px; line-height: 1.6; margin: 0 0 25px; text-align: center;">
                Ada permintaan top-up baru yang menunggu approval Anda
            </p>
            
            <!-- Amount Box -->
            <div style="background: linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%); border: 3px dashed #ff9800; border-radius: 12px; padding: 30px; text-align: center; margin: 25px 0;">
                <p style="margin: 0 0 10px; color: #666; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">JUMLAH TOP-UP</p>
                <div style="font-size: 36px; font-weight: 800; color: #ff6b00; margin: 10px 0;">{formatted_amount}</div>
                <p style="margin: 10px 0 0; color: #666; font-size: 13px;">({currency})</p>
            </div>
            
            <!-- Request Details Card -->
            <div style="background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%); border-left: 4px solid #2196F3; border-radius: 8px; padding: 25px; margin: 25px 0;">
                <h3 style="color: #1976d2; font-size: 16px; font-weight: 600; margin: 0 0 15px;">📋 Detail Permintaan</h3>
                <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                        <td style="padding: 8px 0; color: #666; font-size: 14px;">
                            <strong style="color: #333;">👤 Client:</strong>
                        </td>
                        <td style="padding: 8px 0; color: #333; font-size: 14px; text-align: right;">
                            <strong>{client_name}</strong>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; color: #666; font-size: 14px;">
                            <strong style="color: #333;">📱 Platform:</strong>
                        </td>
                        <td style="padding: 8px 0; color: #333; font-size: 14px; text-align: right;">
                            <strong>{platform}</strong>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; color: #666; font-size: 14px;">
                            <strong style="color: #333;">📊 Nama Akun:</strong>
                        </td>
                        <td style="padding: 8px 0; color: #333; font-size: 14px; text-align: right;">
                            <strong>{account_name}</strong>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; color: #666; font-size: 14px;">
                            <strong style="color: #333;">💵 Currency:</strong>
                        </td>
                        <td style="padding: 8px 0; color: #333; font-size: 14px; text-align: right;">
                            <strong>{currency}</strong>
                        </td>
                    </tr>
                </table>
            </div>
            
            <!-- Urgent Action Required -->
            <div style="background: linear-gradient(135deg, #fff3cd 0%, #fff 100%); border-radius: 12px; padding: 20px; margin: 25px 0; border-left: 4px solid #ffc107;">
                <p style="margin: 0; color: #856404; font-size: 15px; line-height: 1.6;">
                    <strong>⚡ Tindakan Diperlukan</strong><br>
                    <span style="color: #666; font-size: 14px;">Client menunggu approval Anda. Proses secepatnya untuk pengalaman terbaik!</span>
                </p>
            </div>
            
            <!-- CTA Button -->
            <div style="text-align: center; margin: 35px 0;">
                <a href="{FRONTEND_URL}/admin/payments" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 15px 40px; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);">
                    📋 Verifikasi Top-Up
                </a>
            </div>
        </div>
        
        <!-- Footer -->
        <div style="background: #f8f9fa; padding: 30px; text-align: center; color: #666;">
            <p style="margin: 5px 0; font-weight: 600; color: #333;">Rimuru Admin System 🔧</p>
            <p style="margin: 5px 0; font-size: 13px;">© 2025 Rimuru. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
    """
    
    # Send to all admin emails
    success_count = 0
    for admin_email in admin_emails:
        if EmailService.send_email(admin_email, subject, html_content):
            success_count += 1
    
    return success_count > 0


# ============================================
# WALLET TRANSFER & ACCOUNT REQUEST EMAILS
# ============================================

def send_client_wallet_transfer_approved_email(client_email: str, client_name: str, amount: float, currency: str, from_wallet: str, to_account: str) -> bool:
    """Send email to client when wallet transfer is approved"""
    subject = f"✅ Transfer Wallet Disetujui - {currency} {amount:,.0f}"
    
    currency_symbol = "Rp" if currency == "IDR" else "$"
    formatted_amount = f"{currency_symbol} {amount:,.0f}"
    
    html_content = f"""
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f4;">
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f4f4f4;">
        <tr>
            <td align="center" style="padding: 40px 0;">
                <table border="0" cellpadding="0" cellspacing="0" width="600" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                    <tr>
                        <td align="center" style="padding: 40px 40px 30px 40px; background-color: #10b981;">
                            <img src="{LOGO_URL}" alt="Rimuru" style="display: block; width: 120px; height: auto;" />
                        </td>
                    </tr>
                    <tr>
                        <td align="center" style="padding: 30px 40px 10px 40px;">
                            <h1 style="margin: 0; font-family: Arial, sans-serif; font-size: 28px; font-weight: bold; color: #333333;">Transfer Wallet Disetujui!</h1>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 20px 40px;">
                            <p style="margin: 0; font-family: Arial, sans-serif; font-size: 16px; line-height: 24px; color: #333333;">
                                Halo <strong>{client_name}</strong>,
                            </p>
                            <p style="margin: 15px 0 0 0; font-family: Arial, sans-serif; font-size: 16px; line-height: 24px; color: #666666;">
                                Kabar baik! Transfer dari wallet ke akun iklan Anda telah disetujui dan diproses.
                            </p>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 10px 40px 30px 40px;">
                            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #ecfdf5; border-radius: 6px; border: 2px solid #10b981;">
                                <tr>
                                    <td style="padding: 25px; text-align: center;">
                                        <p style="margin: 0 0 10px 0; font-family: Arial, sans-serif; font-size: 14px; color: #047857; text-transform: uppercase; letter-spacing: 1px;">Jumlah Transfer</p>
                                        <p style="margin: 0; font-family: Arial, sans-serif; font-size: 32px; font-weight: bold; color: #059669;">{formatted_amount}</p>
                                        <p style="margin: 10px 0 0 0; font-family: Arial, sans-serif; font-size: 13px; color: #047857;">Dari: {from_wallet} Wallet &rarr; Ke: {to_account}</p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 0 40px 30px 40px;">
                            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #dbeafe; border-left: 4px solid #3b82f6; border-radius: 4px;">
                                <tr>
                                    <td style="padding: 15px 20px;">
                                        <p style="margin: 0; font-family: Arial, sans-serif; font-size: 14px; color: #1e40af;">
                                            <strong>ℹ️ Info:</strong> Saldo sudah masuk ke akun iklan Anda dan siap digunakan untuk campaign.
                                        </p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <tr>
                        <td align="center" style="padding: 20px 40px 30px 40px;">
                            <table border="0" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td align="center" style="border-radius: 50px; background-color: #667eea;">
                                        <a href="{FRONTEND_URL}" target="_blank" style="font-size: 16px; font-family: Arial, sans-serif; font-weight: bold; color: #ffffff; text-decoration: none; display: inline-block; padding: 14px 40px;">Lihat Detail &rarr;</a>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 30px 40px; background-color: #f8f9fa; border-top: 1px solid #e9ecef;">
                            <table border="0" cellpadding="0" cellspacing="0" width="100%">
                                <tr>
                                    <td align="center">
                                        <p style="margin: 0 0 5px 0; font-family: Arial, sans-serif; font-size: 14px; color: #666666;">Email: {EMAIL_FROM.split('<')[1].split('>')[0]}</p>
                                        <p style="margin: 5px 0 0 0; font-family: Arial, sans-serif; font-size: 14px; color: #666666;">Website: <a href="{FRONTEND_URL}" style="color: #667eea; text-decoration: none;">{FRONTEND_URL}</a></p>
                                        <p style="margin: 20px 0 0 0; font-family: Arial, sans-serif; font-size: 12px; color: #999999;">(c) 2025 Rimuru. All rights reserved.</p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
    """
    
    return EmailService.send_email(client_email, subject, html_content)


def send_client_wallet_transfer_rejected_email(client_email: str, client_name: str, amount: float, currency: str, from_wallet: str, to_account: str, reason: str = "") -> bool:
    """Send email to client when wallet transfer is rejected"""
    subject = f"❌ Transfer Wallet Ditolak - {currency} {amount:,.0f}"
    
    currency_symbol = "Rp" if currency == "IDR" else "$"
    formatted_amount = f"{currency_symbol} {amount:,.0f}"
    
    html_content = f"""
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f4;">
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f4f4f4;">
        <tr>
            <td align="center" style="padding: 40px 0;">
                <table border="0" cellpadding="0" cellspacing="0" width="600" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                    <tr>
                        <td align="center" style="padding: 40px 40px 30px 40px; background-color: #ef4444;">
                            <img src="{LOGO_URL}" alt="Rimuru" style="display: block; width: 120px; height: auto;" />
                        </td>
                    </tr>
                    <tr>
                        <td align="center" style="padding: 30px 40px 10px 40px;">
                            <h1 style="margin: 0; font-family: Arial, sans-serif; font-size: 28px; font-weight: bold; color: #333333;">Transfer Wallet Ditolak</h1>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 20px 40px;">
                            <p style="margin: 0; font-family: Arial, sans-serif; font-size: 16px; line-height: 24px; color: #333333;">
                                Halo <strong>{client_name}</strong>,
                            </p>
                            <p style="margin: 15px 0 0 0; font-family: Arial, sans-serif; font-size: 16px; line-height: 24px; color: #666666;">
                                Mohon maaf, permintaan transfer wallet Anda tidak dapat diproses.
                            </p>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 10px 40px;">
                            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #fef2f2; border-radius: 6px; border: 2px solid #ef4444;">
                                <tr>
                                    <td style="padding: 25px;">
                                        <p style="margin: 0 0 10px 0; font-family: Arial, sans-serif; font-size: 14px; color: #7f1d1d; text-transform: uppercase;">Jumlah Transfer</p>
                                        <p style="margin: 0; font-family: Arial, sans-serif; font-size: 24px; font-weight: bold; color: #dc2626;">{formatted_amount}</p>
                                        <p style="margin: 5px 0 0 0; font-family: Arial, sans-serif; font-size: 13px; color: #991b1b;">Dari: {from_wallet} &rarr; Ke: {to_account}</p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 20px 40px 30px 40px;">
                            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #fff7ed; border-left: 4px solid #f59e0b; border-radius: 4px;">
                                <tr>
                                    <td style="padding: 20px;">
                                        <p style="margin: 0 0 10px 0; font-family: Arial, sans-serif; font-size: 15px; color: #92400e; font-weight: bold;">📋 Alasan Penolakan:</p>
                                        <p style="margin: 0; font-family: Arial, sans-serif; font-size: 14px; color: #78350f; line-height: 20px;">{reason or "Mohon hubungi admin untuk informasi lebih lanjut."}</p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <tr>
                        <td align="center" style="padding: 20px 40px 30px 40px;">
                            <table border="0" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td align="center" style="border-radius: 50px; background-color: #667eea;">
                                        <a href="{FRONTEND_URL}" target="_blank" style="font-size: 16px; font-family: Arial, sans-serif; font-weight: bold; color: #ffffff; text-decoration: none; display: inline-block; padding: 14px 40px;">Hubungi Admin &rarr;</a>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 30px 40px; background-color: #f8f9fa; border-top: 1px solid #e9ecef;">
                            <table border="0" cellpadding="0" cellspacing="0" width="100%">
                                <tr>
                                    <td align="center">
                                        <p style="margin: 0 0 5px 0; font-family: Arial, sans-serif; font-size: 14px; color: #666666;">Email: {EMAIL_FROM.split('<')[1].split('>')[0]}</p>
                                        <p style="margin: 5px 0 0 0; font-family: Arial, sans-serif; font-size: 14px; color: #666666;">Website: <a href="{FRONTEND_URL}" style="color: #667eea; text-decoration: none;">{FRONTEND_URL}</a></p>
                                        <p style="margin: 20px 0 0 0; font-family: Arial, sans-serif; font-size: 12px; color: #999999;">(c) 2025 Rimuru. All rights reserved.</p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
    """
    
    return EmailService.send_email(client_email, subject, html_content)


def send_admin_wallet_transfer_request_email(admin_emails: list, client_name: str, amount: float, currency: str, from_wallet: str, to_account: str) -> bool:
    """Send email to all admins when new wallet transfer request is created"""
    subject = f"🔄 Permintaan Transfer Wallet Baru - {currency} {amount:,.0f}"
    
    currency_symbol = "Rp" if currency == "IDR" else "$"
    formatted_amount = f"{currency_symbol} {amount:,.0f}"
    
    html_content = f"""
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f4;">
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f4f4f4;">
        <tr>
            <td align="center" style="padding: 40px 0;">
                <table border="0" cellpadding="0" cellspacing="0" width="600" style="background-color: #ffffff; border-radius: 8px; overflow: hidden;">
                    <tr>
                        <td align="center" style="padding: 30px; background-color: #8b5cf6;">
                            <h1 style="margin: 0; font-family: Arial, sans-serif; font-size: 24px; font-weight: bold; color: #ffffff;">🔄 Transfer Wallet Baru</h1>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 30px;">
                            <p style="margin: 0; font-family: Arial, sans-serif; font-size: 16px; color: #333;">
                                <strong>Halo Admin!</strong><br>Ada permintaan transfer wallet yang menunggu approval.
                            </p>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 0 30px 20px 30px;">
                            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #faf5ff; border: 2px dashed #8b5cf6; border-radius: 8px;">
                                <tr>
                                    <td style="padding: 20px; text-align: center;">
                                        <p style="margin: 0; font-family: Arial, sans-serif; font-size: 32px; font-weight: bold; color: #7c3aed;">{formatted_amount}</p>
                                        <p style="margin: 10px 0 0 0; font-family: Arial, sans-serif; font-size: 14px; color: #6b21a8;">
                                            {from_wallet} Wallet &rarr; {to_account}
                                        </p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 0 30px 20px 30px;">
                            <p style="margin: 0; font-family: Arial, sans-serif; font-size: 14px; color: #666;">
                                <strong>👤 Client:</strong> {client_name}<br>
                                <strong>💵 Currency:</strong> {currency}
                            </p>
                        </td>
                    </tr>
                    <tr>
                        <td align="center" style="padding: 20px 30px;">
                            <table border="0" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td style="border-radius: 50px; background-color: #8b5cf6;">
                                        <a href="{FRONTEND_URL}/admin" style="font-size: 16px; font-family: Arial, sans-serif; font-weight: bold; color: #ffffff; text-decoration: none; padding: 14px 40px; display: inline-block;">✅ Proses Sekarang</a>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 20px 30px; background-color: #f8f9fa; text-align: center;">
                            <p style="margin: 0; font-family: Arial, sans-serif; font-size: 12px; color: #999;">(c) 2025 Rimuru Admin Team</p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
    """
    
    success_count = 0
    for admin_email in admin_emails:
        if EmailService.send_email(admin_email, subject, html_content):
            success_count += 1
    
    return success_count > 0


def send_admin_new_withdraw_request_email(admin_emails: list, client_name: str, amount: float, currency: str, account_name: str) -> bool:
    """Send email to all admins when new withdraw request is created"""
    if not admin_emails:
        return False
    
    currency_symbol = "Rp" if currency == "IDR" else "$"
    formatted_amount = f"{currency_symbol} {amount:,.0f}"
    
    subject = f"💸 Permintaan Withdraw Baru - {formatted_amount}"
    
    html_content = f"""
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f4; font-family: 'Helvetica Neue', Arial, sans-serif;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <!-- Header with Logo -->
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; text-align: center;">
            <img src="{LOGO_URL}" alt="Rimuru" style="width: 120px; height: auto; display: block; margin: 0 auto;" />
        </div>
        
        <!-- Main Content -->
        <div style="padding: 40px 30px;">
            <!-- Alert Icon -->
            <div style="text-align: center; margin-bottom: 30px;">
                <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); width: 80px; height: 80px; border-radius: 50%; margin: 0 auto; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 15px rgba(240, 147, 251, 0.3);">
                    <span style="font-size: 40px;">💸</span>
                </div>
            </div>
            
            <h1 style="color: #333; font-size: 28px; font-weight: 700; margin: 0 0 20px; text-align: center;">
                Permintaan Withdraw Baru!
            </h1>
            
            <p style="color: #666; font-size: 16px; line-height: 1.6; margin: 0 0 25px; text-align: center;">
                Ada permintaan penarikan saldo yang menunggu proses Anda
            </p>
            
            <!-- Amount Box -->
            <div style="background: linear-gradient(135deg, #ffe8f0 0%, #ffd5e3 100%); border: 3px dashed #f5576c; border-radius: 12px; padding: 30px; text-align: center; margin: 25px 0;">
                <p style="margin: 0 0 10px; color: #666; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">JUMLAH WITHDRAW</p>
                <div style="font-size: 36px; font-weight: 800; color: #f5576c; margin: 10px 0;">{formatted_amount}</div>
                <p style="margin: 10px 0 0; color: #666; font-size: 13px;">({currency})</p>
            </div>
            
            <!-- Request Details Card -->
            <div style="background: linear-gradient(135deg, #fce4ec 0%, #f8bbd0 100%); border-left: 4px solid #f5576c; border-radius: 8px; padding: 25px; margin: 25px 0;">
                <h3 style="color: #c2185b; font-size: 16px; font-weight: 600; margin: 0 0 15px;">📋 Detail Permintaan</h3>
                <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                        <td style="padding: 8px 0; color: #666; font-size: 14px;">
                            <strong style="color: #333;">👤 Client:</strong>
                        </td>
                        <td style="padding: 8px 0; color: #333; font-size: 14px; text-align: right;">
                            <strong>{client_name}</strong>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; color: #666; font-size: 14px;">
                            <strong style="color: #333;">📊 Nama Akun:</strong>
                        </td>
                        <td style="padding: 8px 0; color: #333; font-size: 14px; text-align: right;">
                            <strong>{account_name}</strong>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; color: #666; font-size: 14px;">
                            <strong style="color: #333;">💵 Currency:</strong>
                        </td>
                        <td style="padding: 8px 0; color: #333; font-size: 14px; text-align: right;">
                            <strong>{currency}</strong>
                        </td>
                    </tr>
                </table>
            </div>
            
            <!-- Action Required -->
            <div style="background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%); border-radius: 12px; padding: 20px; margin: 25px 0; border-left: 4px solid #2196F3;">
                <p style="margin: 0; color: #1565c0; font-size: 15px; line-height: 1.6;">
                    <strong>⚡ Tindakan Diperlukan</strong><br>
                    <span style="color: #666; font-size: 14px;">Silakan login ke dashboard admin untuk memverifikasi dan memproses permintaan withdraw ini</span>
                </p>
            </div>
            
            <!-- CTA Button -->
            <div style="text-align: center; margin: 35px 0;">
                <a href="{FRONTEND_URL}/admin/withdraws" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 15px 40px; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);">
                    ✅ Proses Withdraw
                </a>
            </div>
        </div>
        
        <!-- Footer -->
        <div style="background: #f8f9fa; padding: 30px; text-align: center; color: #666;">
            <p style="margin: 5px 0; font-weight: 600; color: #333;">Rimuru Admin System 🔧</p>
            <p style="margin: 5px 0; font-size: 13px;">© 2025 Rimuru. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
    """
    
    # Send to all admin emails
    success_count = 0
    for admin_email in admin_emails:
        if EmailService.send_email(admin_email, subject, html_content):
            success_count += 1
    
    logger.info(f"📧 Withdraw request notification emails sent to {success_count}/{len(admin_emails)} admins")
    return success_count > 0


# ============================================
# CLIENT NOTIFICATION EMAILS
# ============================================

def send_client_topup_approved_email(client_email: str, client_name: str, amount: float, currency: str, account_name: str, admin_notes: str = "") -> bool:
    """Send email to client when top-up is approved"""
    subject = f"✅ Top-Up Disetujui - {currency} {amount:,.0f}"
    
    currency_symbol = "Rp" if currency == "IDR" else "$"
    formatted_amount = f"{currency_symbol} {amount:,.0f}"
    
    html_content = f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body {{ font-family: 'Segoe UI', sans-serif; margin: 0; padding: 0; background: #f4f7fa; }}
        .container {{ max-width: 650px; margin: 30px auto; background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 40px rgba(0,0,0,0.1); }}
        .header {{ background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); padding: 50px 30px; text-align: center; }}
        .header .icon {{ font-size: 60px; margin-bottom: 15px; animation: bounce 1s ease; }}
        .header h1 {{ color: white; margin: 0; font-size: 32px; font-weight: 700; }}
        @keyframes bounce {{ 0%, 100% {{ transform: translateY(0); }} 50% {{ transform: translateY(-10px); }} }}
        .content {{ padding: 40px 30px; }}
        .success-box {{ background: linear-gradient(135deg, #e8f5e9 0%, #fff 100%); border: 3px solid #4caf50; padding: 35px; border-radius: 16px; text-align: center; margin: 25px 0; box-shadow: 0 6px 25px rgba(76,175,80,0.2); }}
        .success-box .amount {{ font-size: 48px; font-weight: 900; color: #2e7d32; margin: 15px 0; text-shadow: 2px 2px 4px rgba(0,0,0,0.1); }}
        .info-card {{ background: #f8f9ff; padding: 25px; border-radius: 12px; border-left: 5px solid #667eea; margin: 20px 0; }}
        .info-row {{ display: flex; justify-content: space-between; margin: 12px 0; padding: 10px 0; border-bottom: 1px dashed #e0e0e0; }}
        .info-row:last-child {{ border-bottom: none; }}
        .label {{ color: #666; font-weight: 600; }}
        .value {{ color: #333; font-weight: 700; }}
        .btn {{ display: inline-block; background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); color: white; padding: 18px 45px; text-decoration: none; border-radius: 30px; font-weight: 700; margin: 25px 0; box-shadow: 0 10px 25px rgba(17,153,142,0.3); font-size: 16px; }}
        .celebration {{ text-align: center; font-size: 40px; margin: 20px 0; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <img src="https://customer-assets.emergentagent.com/job_fintech-rimuru/artifacts/xxp79cki_Logo%20Rimuru%20New.png" alt="Rimuru Logo" style="max-width: 120px; height: auto; margin-bottom: 15px;" />
            <div class="icon">✅</div>
            <h1>Top-Up Berhasil Disetujui!</h1>
            <p style="color: rgba(255,255,255,0.95); margin: 10px 0 0 0; font-size: 16px;">Saldo akun Anda sudah ditambahkan</p>
        </div>
        
        <div class="content">
            <div class="celebration">🎉 🎊 🎉</div>
            
            <p style="font-size: 18px; color: #333; text-align: center; line-height: 1.8;">
                <strong>Halo {client_name}!</strong><br>
                Kabar gembira! Permintaan top-up Anda telah <span style="color: #4caf50; font-weight: 700;">disetujui dan diproses</span> oleh tim kami.
            </p>
            
            <div class="success-box">
                <p style="margin: 0; color: #666; font-size: 15px; font-weight: 600;">SALDO DITAMBAHKAN</p>
                <div class="amount">{formatted_amount}</div>
                <p style="margin: 0; color: #2e7d32; font-size: 14px; font-weight: 600;">✨ Sudah masuk ke akun Anda</p>
            </div>
            
            <div class="info-card">
                <div class="info-row">
                    <div class="label">📱 Nama Akun:</div>
                    <div class="value">{account_name}</div>
                </div>
                <div class="info-row">
                    <div class="label">💵 Currency:</div>
                    <div class="value">{currency}</div>
                </div>
                <div class="info-row">
                    <div class="label">✅ Status:</div>
                    <div class="value" style="color: #4caf50;">Disetujui & Diproses</div>
                </div>
            </div>
            
            {"<div style='background: linear-gradient(135deg, #e3f2fd 0%, #fff 100%); border-left: 5px solid #2196f3; padding: 20px; border-radius: 12px; margin: 20px 0;'><p style='margin: 0; color: #1976d2; font-weight: 600;'><strong>💬 Catatan Admin:</strong><br>" + admin_notes + "</p></div>" if admin_notes else ""}
            
            <div style="background: linear-gradient(135deg, #fff9c4 0%, #fff 100%); border-radius: 12px; padding: 20px; margin: 25px 0; text-align: center;">
                <p style="margin: 0; color: #f57c00; font-weight: 600;">
                    🚀 Saldo Anda siap digunakan untuk campaign iklan!
                </p>
            </div>
            
            <div style="text-align: center;">
                <a href="https://rimuru.id" class="btn">📊 Lihat Dashboard Saya</a>
            </div>
        </div>
        
        <div style="background: #f8f9fa; padding: 30px; text-align: center; color: #666;">
            <p style="margin: 5px 0; font-weight: 600; color: #333;">Terima kasih menggunakan Rimuru! 🙏</p>
            <p style="margin: 5px 0; font-size: 13px;">(c) 2025 Rimuru. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
    """
    
    return EmailService.send_email(client_email, subject, html_content)


def send_client_topup_rejected_email(client_email: str, client_name: str, amount: float, currency: str, account_name: str, reason: str = "") -> bool:
    """Send email to client when top-up is rejected"""
    subject = f"❌ Top-Up Ditolak - {currency} {amount:,.0f}"
    
    currency_symbol = "Rp" if currency == "IDR" else "$"
    formatted_amount = f"{currency_symbol} {amount:,.0f}"
    
    html_content = f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body {{ font-family: 'Segoe UI', sans-serif; margin: 0; padding: 0; background: #f4f7fa; }}
        .container {{ max-width: 650px; margin: 30px auto; background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 40px rgba(0,0,0,0.1); }}
        .header {{ background: linear-gradient(135deg, #f5576c 0%, #d32f2f 100%); padding: 50px 30px; text-align: center; }}
        .header .icon {{ font-size: 60px; margin-bottom: 15px; }}
        .header h1 {{ color: white; margin: 0; font-size: 32px; font-weight: 700; }}
        .content {{ padding: 40px 30px; }}
        .reject-box {{ background: linear-gradient(135deg, #ffebee 0%, #fff 100%); border: 3px solid #f44336; padding: 35px; border-radius: 16px; text-align: center; margin: 25px 0; }}
        .reject-box .amount {{ font-size: 42px; font-weight: 900; color: #d32f2f; margin: 15px 0; }}
        .reason-box {{ background: #fff3e0; border-left: 5px solid #ff9800; padding: 25px; border-radius: 12px; margin: 25px 0; }}
        .info-card {{ background: #f8f9ff; padding: 25px; border-radius: 12px; margin: 20px 0; }}
        .btn {{ display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 16px 40px; text-decoration: none; border-radius: 30px; font-weight: 700; margin: 20px 5px; box-shadow: 0 8px 20px rgba(102,126,234,0.3); }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <img src="https://customer-assets.emergentagent.com/job_fintech-rimuru/artifacts/xxp79cki_Logo%20Rimuru%20New.png" alt="Rimuru Logo" style="max-width: 120px; height: auto; margin-bottom: 15px;" />
            <div class="icon">❌</div>
            <h1>Permintaan Top-Up Ditolak</h1>
        </div>
        
        <div class="content">
            <p style="font-size: 17px; color: #333; text-align: center; line-height: 1.8;">
                <strong>Halo {client_name},</strong><br>
                Mohon maaf, permintaan top-up Anda tidak dapat diproses.
            </p>
            
            <div class="reject-box">
                <p style="margin: 0; color: #666; font-size: 14px;">JUMLAH DITOLAK</p>
                <div class="amount">{formatted_amount}</div>
                <p style="margin: 5px 0 0 0; color: #d32f2f; font-weight: 600;">Status: Ditolak</p>
            </div>
            
            <div class="info-card">
                <p style="margin: 0 0 10px 0; color: #666; font-size: 13px; font-weight: 600;">DETAIL:</p>
                <p style="margin: 5px 0;"><strong>Nama Akun:</strong> {account_name}</p>
                <p style="margin: 5px 0;"><strong>Currency:</strong> {currency}</p>
            </div>
            
            <div class="reason-box">
                <p style="margin: 0 0 10px 0; color: #e65100; font-weight: 700; font-size: 15px;">📋 ALASAN PENOLAKAN:</p>
                <p style="margin: 0; color: #333; font-weight: 600; line-height: 1.6;">{reason or "Mohon hubungi admin untuk informasi lebih lanjut."}</p>
            </div>
            
            <div style="background: linear-gradient(135deg, #e3f2fd 0%, #fff 100%); border-radius: 12px; padding: 25px; margin: 25px 0; text-align: center;">
                <p style="margin: 0; color: #1976d2; font-weight: 600; line-height: 1.6;">
                    💡 <strong>Apa yang bisa dilakukan?</strong><br>
                    Silakan perbaiki data sesuai catatan admin dan ajukan ulang permintaan top-up Anda.
                </p>
            </div>
            
            <div style="text-align: center;">
                <a href="https://rimuru.id" class="btn">🔄 Ajukan Top-Up Baru</a>
                <a href="#" class="btn" style="background: linear-gradient(135deg, #e0e0e0 0%, #bdbdbd 100%);">💬 Hubungi Admin</a>
            </div>
        </div>
        
        <div style="background: #f8f9fa; padding: 30px; text-align: center; color: #666;">
            <p style="margin: 5px 0;">Butuh bantuan? Hubungi support kami</p>
            <p style="margin: 5px 0; font-size: 13px;">(c) 2025 Rimuru</p>
        </div>
    </div>
</body>
</html>
    """
    
    return EmailService.send_email(client_email, subject, html_content)


def send_client_withdraw_approved_email(client_email: str, client_name: str, amount: float, currency: str, account_name: str) -> bool:
    """Send email to client when withdraw is approved"""
    subject = f"✅ Penarikan Saldo Disetujui - {currency} {amount:,.0f}"
    
    currency_symbol = "Rp" if currency == "IDR" else "$"
    formatted_amount = f"{currency_symbol} {amount:,.0f}"
    
    html_content = f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body {{ font-family: 'Segoe UI', sans-serif; margin: 0; padding: 0; background: #f4f7fa; }}
        .container {{ max-width: 650px; margin: 30px auto; background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 40px rgba(0,0,0,0.1); }}
        .header {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 50px 30px; text-align: center; }}
        .header .icon {{ font-size: 60px; margin-bottom: 15px; }}
        .header h1 {{ color: white; margin: 0; font-size: 30px; font-weight: 700; }}
        .content {{ padding: 40px 30px; }}
        .amount-box {{ background: linear-gradient(135deg, #e8f5e9 0%, #fff 100%); border: 3px solid #4caf50; padding: 35px; border-radius: 16px; text-align: center; margin: 25px 0; }}
        .amount-box .amount {{ font-size: 48px; font-weight: 900; color: #2e7d32; margin: 15px 0; }}
        .timeline {{ margin: 30px 0; }}
        .timeline-item {{ display: flex; align-items: center; margin: 20px 0; }}
        .timeline-icon {{ width: 50px; height: 50px; background: #4caf50; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 24px; margin-right: 20px; box-shadow: 0 4px 10px rgba(76,175,80,0.3); }}
        .timeline-content {{ flex: 1; }}
        .btn {{ display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 16px 40px; text-decoration: none; border-radius: 30px; font-weight: 700; margin: 20px 0; box-shadow: 0 8px 20px rgba(102,126,234,0.3); }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <img src="https://customer-assets.emergentagent.com/job_fintech-rimuru/artifacts/xxp79cki_Logo%20Rimuru%20New.png" alt="Rimuru Logo" style="max-width: 120px; height: auto; margin-bottom: 15px;" />
            <div class="icon">✅</div>
            <h1>Penarikan Saldo Disetujui!</h1>
            <p style="color: rgba(255,255,255,0.95); margin: 10px 0 0 0;">Saldo akan segera ditransfer</p>
        </div>
        
        <div class="content">
            <p style="font-size: 17px; color: #333; text-align: center; line-height: 1.8;">
                <strong>Halo {client_name}!</strong><br>
                Kabar baik! Permintaan penarikan saldo Anda telah <span style="color: #4caf50; font-weight: 700;">disetujui</span>.
            </p>
            
            <div class="amount-box">
                <p style="margin: 0; color: #666; font-size: 14px;">JUMLAH PENARIKAN</p>
                <div class="amount">{formatted_amount}</div>
                <p style="margin: 5px 0 0 0; color: #2e7d32; font-weight: 600;">Dari: {account_name}</p>
            </div>
            
            <div class="timeline">
                <div class="timeline-item">
                    <div class="timeline-icon">✅</div>
                    <div class="timeline-content">
                        <strong style="color: #2e7d32;">Disetujui</strong>
                        <p style="margin: 5px 0; color: #666; font-size: 14px;">Permintaan Anda telah direview dan disetujui</p>
                    </div>
                </div>
                <div class="timeline-item">
                    <div class="timeline-icon" style="background: #ff9800;">⏳</div>
                    <div class="timeline-content">
                        <strong style="color: #e65100;">Dalam Proses</strong>
                        <p style="margin: 5px 0; color: #666; font-size: 14px;">Tim kami sedang memproses transfer ke rekening Anda</p>
                    </div>
                </div>
                <div class="timeline-item">
                    <div class="timeline-icon" style="background: #9e9e9e;">💰</div>
                    <div class="timeline-content">
                        <strong style="color: #616161;">Akan Selesai</strong>
                        <p style="margin: 5px 0; color: #666; font-size: 14px;">Dana akan masuk dalam 1-3 hari kerja</p>
                    </div>
                </div>
            </div>
            
            <div style="background: linear-gradient(135deg, #e3f2fd 0%, #fff 100%); border-radius: 12px; padding: 25px; margin: 25px 0;">
                <p style="margin: 0; color: #1976d2; font-weight: 600; text-align: center;">
                    📱 Anda akan menerima notifikasi saat dana sudah masuk ke rekening Anda
                </p>
            </div>
            
            <div style="text-align: center;">
                <a href="https://rimuru.id" class="btn">📊 Lihat Status Penarikan</a>
            </div>
        </div>
        
        <div style="background: #f8f9fa; padding: 30px; text-align: center; color: #666;">
            <p style="margin: 5px 0; font-weight: 600; color: #333;">Terima kasih! 🙏</p>
            <p style="margin: 5px 0; font-size: 13px;">(c) 2025 Rimuru</p>
        </div>
    </div>
</body>
</html>
    """
    
    return EmailService.send_email(client_email, subject, html_content)


def send_client_account_request_approved_email(client_email: str, client_name: str, platform: str, account_name: str) -> bool:
    """Send email to client when account request is approved"""
    platform_display = {
        "facebook": "Facebook Ads",
        "google": "Google Ads",
        "tiktok": "TikTok Ads"
    }.get(platform.lower(), platform.title())
    
    subject = f"🎉 Permintaan Akun {platform_display} Disetujui - {account_name}"
    
    html_content = f"""
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f4; font-family: 'Helvetica Neue', Arial, sans-serif;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <!-- Header with Logo -->
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; text-align: center;">
            <img src="{LOGO_URL}" alt="Rimuru" style="width: 120px; height: auto; display: block; margin: 0 auto;" />
        </div>
        
        <!-- Main Content -->
        <div style="padding: 40px 30px;">
            <!-- Success Icon -->
            <div style="text-align: center; margin-bottom: 30px;">
                <div style="background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%); width: 80px; height: 80px; border-radius: 50%; margin: 0 auto; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 15px rgba(76, 175, 80, 0.3);">
                    <span style="font-size: 40px;">🎉</span>
                </div>
            </div>
            
            <h1 style="color: #333; font-size: 28px; font-weight: 700; margin: 0 0 20px; text-align: center;">
                Permintaan Akun Disetujui!
            </h1>
            
            <p style="color: #666; font-size: 16px; line-height: 1.6; margin: 0 0 25px;">
                Halo <strong style="color: #333;">{client_name}</strong>,
            </p>
            
            <p style="color: #666; font-size: 16px; line-height: 1.6; margin: 0 0 25px;">
                Kabar baik! Permintaan akun <strong style="color: #667eea;">{platform_display}</strong> Anda telah <strong style="color: #4CAF50;">disetujui</strong>. 🎊
            </p>
            
            <!-- Account Details Card -->
            <div style="background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%); border-left: 4px solid #4CAF50; border-radius: 8px; padding: 25px; margin: 25px 0;">
                <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                        <td style="padding: 8px 0; color: #666; font-size: 14px;">
                            <strong style="color: #333;">Platform:</strong>
                        </td>
                        <td style="padding: 8px 0; color: #333; font-size: 14px; text-align: right;">
                            <strong>{platform_display}</strong>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; color: #666; font-size: 14px;">
                            <strong style="color: #333;">Nama Akun:</strong>
                        </td>
                        <td style="padding: 8px 0; color: #333; font-size: 14px; text-align: right;">
                            <strong>{account_name}</strong>
                        </td>
                    </tr>
                </table>
            </div>
            
            <!-- Status Info -->
            <div style="background: linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%); border-radius: 12px; padding: 20px; margin: 25px 0; border-left: 4px solid #ff9800;">
                <p style="margin: 0; color: #e65100; font-size: 15px; line-height: 1.6;">
                    <strong>⏳ Status Saat Ini: Sedang Dalam Proses Share</strong><br>
                    <span style="color: #666; font-size: 14px;">Akun Anda sedang dalam proses share dan akan segera siap digunakan.</span>
                </p>
            </div>
            
            <!-- Next Steps -->
            <div style="margin: 30px 0;">
                <h3 style="color: #333; font-size: 18px; font-weight: 600; margin: 0 0 15px;">Langkah Selanjutnya:</h3>
                <ol style="color: #666; font-size: 15px; line-height: 1.8; margin: 0; padding-left: 20px;">
                    <li>Tim kami sedang memproses share akun Anda</li>
                    <li>Anda akan menerima notifikasi saat akun siap digunakan</li>
                    <li>Setelah aktif, Anda dapat melakukan top-up dan mengelola akun Anda</li>
                </ol>
            </div>
            
            <!-- CTA Button -->
            <div style="text-align: center; margin: 35px 0;">
                <a href="{FRONTEND_URL}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 15px 40px; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);">
                    📊 Lihat Akun Saya
                </a>
            </div>
            
            <!-- Support Info -->
            <div style="background: #f8f9fa; border-radius: 8px; padding: 20px; margin: 25px 0; text-align: center;">
                <p style="margin: 0 0 10px; color: #666; font-size: 14px;">
                    Butuh bantuan? Tim kami siap membantu Anda! 💬
                </p>
                <p style="margin: 0; color: #999; font-size: 13px;">
                    Hubungi kami melalui dashboard Rimuru Anda
                </p>
            </div>
        </div>
        
        <!-- Footer -->
        <div style="background: #f8f9fa; padding: 30px; text-align: center; color: #666;">
            <p style="margin: 5px 0; font-weight: 600; color: #333;">Terima kasih telah menggunakan Rimuru! 🙏</p>
            <p style="margin: 5px 0; font-size: 13px;">(c) 2025 Rimuru. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
    """
    
    return EmailService.send_email(client_email, subject, html_content)

def send_client_account_request_rejected_email(client_email: str, client_name: str, platform: str, account_name: str, reason: str = "") -> bool:
    """Send email to client when account request is rejected"""
    platform_display = {
        "facebook": "Facebook Ads",
        "google": "Google Ads",
        "tiktok": "TikTok Ads"
    }.get(platform.lower(), platform.title())
    
    subject = f"❌ Permintaan Akun {platform_display} Ditolak - {account_name}"
    
    reason_html = ""
    if reason:
        reason_html = f"""
            <div style="background: #fff3e0; border-left: 4px solid #ff9800; border-radius: 8px; padding: 20px; margin: 25px 0;">
                <p style="margin: 0 0 8px; color: #e65100; font-weight: 600; font-size: 15px;">📝 Alasan Penolakan:</p>
                <p style="margin: 0; color: #666; font-size: 14px; line-height: 1.6;">{reason}</p>
            </div>
        """
    
    html_content = f"""
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f4; font-family: 'Helvetica Neue', Arial, sans-serif;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <!-- Header with Logo -->
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; text-align: center;">
            <img src="{LOGO_URL}" alt="Rimuru" style="width: 120px; height: auto; display: block; margin: 0 auto;" />
        </div>
        
        <!-- Main Content -->
        <div style="padding: 40px 30px;">
            <!-- Rejection Icon -->
            <div style="text-align: center; margin-bottom: 30px;">
                <div style="background: linear-gradient(135deg, #f44336 0%, #d32f2f 100%); width: 80px; height: 80px; border-radius: 50%; margin: 0 auto; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 15px rgba(244, 67, 54, 0.3);">
                    <span style="font-size: 40px;">❌</span>
                </div>
            </div>
            
            <h1 style="color: #333; font-size: 28px; font-weight: 700; margin: 0 0 20px; text-align: center;">
                Permintaan Akun Ditolak
            </h1>
            
            <p style="color: #666; font-size: 16px; line-height: 1.6; margin: 0 0 25px;">
                Halo <strong style="color: #333;">{client_name}</strong>,
            </p>
            
            <p style="color: #666; font-size: 16px; line-height: 1.6; margin: 0 0 25px;">
                Mohon maaf, permintaan akun <strong style="color: #667eea;">{platform_display}</strong> Anda tidak dapat disetujui saat ini.
            </p>
            
            <!-- Account Details Card -->
            <div style="background: linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%); border-left: 4px solid #f44336; border-radius: 8px; padding: 25px; margin: 25px 0;">
                <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                        <td style="padding: 8px 0; color: #666; font-size: 14px;">
                            <strong style="color: #333;">Platform:</strong>
                        </td>
                        <td style="padding: 8px 0; color: #333; font-size: 14px; text-align: right;">
                            <strong>{platform_display}</strong>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; color: #666; font-size: 14px;">
                            <strong style="color: #333;">Nama Akun:</strong>
                        </td>
                        <td style="padding: 8px 0; color: #333; font-size: 14px; text-align: right;">
                            <strong>{account_name}</strong>
                        </td>
                    </tr>
                </table>
            </div>
            
            {reason_html}
            
            <!-- Next Steps -->
            <div style="background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%); border-radius: 12px; padding: 25px; margin: 25px 0; border-left: 4px solid #2196F3;">
                <h3 style="color: #1976d2; font-size: 16px; font-weight: 600; margin: 0 0 15px;">💡 Apa yang Bisa Dilakukan?</h3>
                <ul style="color: #666; font-size: 14px; line-height: 1.8; margin: 0; padding-left: 20px;">
                    <li>Periksa persyaratan yang dibutuhkan untuk platform ini</li>
                    <li>Perbaiki informasi yang kurang lengkap atau tidak sesuai</li>
                    <li>Hubungi tim support kami untuk bantuan lebih lanjut</li>
                    <li>Ajukan permintaan baru dengan informasi yang sudah diperbaiki</li>
                </ul>
            </div>
            
            <!-- CTA Buttons -->
            <div style="text-align: center; margin: 35px 0;">
                <a href="{FRONTEND_URL}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 15px 40px; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3); margin: 5px;">
                    🔄 Ajukan Permintaan Baru
                </a>
                <br><br>
                <a href="{FRONTEND_URL}" style="display: inline-block; background: #ffffff; color: #667eea; text-decoration: none; padding: 15px 40px; border-radius: 8px; font-weight: 600; font-size: 16px; border: 2px solid #667eea; margin: 5px;">
                    💬 Hubungi Support
                </a>
            </div>
            
            <!-- Support Info -->
            <div style="background: #f8f9fa; border-radius: 8px; padding: 20px; margin: 25px 0; text-align: center;">
                <p style="margin: 0 0 10px; color: #666; font-size: 14px;">
                    Butuh bantuan? Tim kami siap membantu Anda! 💬
                </p>
                <p style="margin: 0; color: #999; font-size: 13px;">
                    Hubungi kami melalui dashboard Rimuru Anda
                </p>
            </div>
        </div>
        
        <!-- Footer -->
        <div style="background: #f8f9fa; padding: 30px; text-align: center; color: #666;">
            <p style="margin: 5px 0; font-weight: 600; color: #333;">Terima kasih! 🙏</p>
            <p style="margin: 5px 0; font-size: 13px;">(c) 2025 Rimuru. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
    """
    
    return EmailService.send_email(client_email, subject, html_content)

def send_admin_new_share_request_email(admin_emails: list, client_name: str, platform: str, account_name: str, target_count: int) -> bool:
    """Send email to admins when new share account request is created"""
    if not admin_emails:
        return False
    
    platform_display = {
        "facebook": "Facebook Ads",
        "google": "Google Ads",
        "tiktok": "TikTok Ads"
    }.get(platform.lower(), platform.title())
    
    subject = f"🔄 Permintaan Share Akun Baru - {platform_display}"
    
    html_content = f"""
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f4; font-family: 'Helvetica Neue', Arial, sans-serif;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <!-- Header with Logo -->
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; text-align: center;">
            <img src="{LOGO_URL}" alt="Rimuru" style="width: 120px; height: auto; display: block; margin: 0 auto;" />
        </div>
        
        <!-- Main Content -->
        <div style="padding: 40px 30px;">
            <!-- Alert Icon -->
            <div style="text-align: center; margin-bottom: 30px;">
                <div style="background: linear-gradient(135deg, #2196F3 0%, #1976d2 100%); width: 80px; height: 80px; border-radius: 50%; margin: 0 auto; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 15px rgba(33, 150, 243, 0.3);">
                    <span style="font-size: 40px;">🔄</span>
                </div>
            </div>
            
            <h1 style="color: #333; font-size: 28px; font-weight: 700; margin: 0 0 20px; text-align: center;">
                Permintaan Share Akun Baru
            </h1>
            
            <p style="color: #666; font-size: 16px; line-height: 1.6; margin: 0 0 25px; text-align: center;">
                Ada permintaan share akun baru yang perlu diproses
            </p>
            
            <!-- Request Details Card -->
            <div style="background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%); border-left: 4px solid #2196F3; border-radius: 8px; padding: 25px; margin: 25px 0;">
                <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                        <td style="padding: 8px 0; color: #666; font-size: 14px;">
                            <strong style="color: #333;">👤 Client:</strong>
                        </td>
                        <td style="padding: 8px 0; color: #333; font-size: 14px; text-align: right;">
                            <strong>{client_name}</strong>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; color: #666; font-size: 14px;">
                            <strong style="color: #333;">📱 Platform:</strong>
                        </td>
                        <td style="padding: 8px 0; color: #333; font-size: 14px; text-align: right;">
                            <strong>{platform_display}</strong>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; color: #666; font-size: 14px;">
                            <strong style="color: #333;">📊 Nama Akun:</strong>
                        </td>
                        <td style="padding: 8px 0; color: #333; font-size: 14px; text-align: right;">
                            <strong>{account_name}</strong>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; color: #666; font-size: 14px;">
                            <strong style="color: #333;">🎯 Target Share:</strong>
                        </td>
                        <td style="padding: 8px 0; color: #333; font-size: 14px; text-align: right;">
                            <strong>{target_count} target</strong>
                        </td>
                    </tr>
                </table>
            </div>
            
            <!-- Action Required -->
            <div style="background: linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%); border-radius: 12px; padding: 20px; margin: 25px 0; border-left: 4px solid #ff9800;">
                <p style="margin: 0; color: #e65100; font-size: 15px; line-height: 1.6;">
                    <strong>⚡ Tindakan Diperlukan</strong><br>
                    <span style="color: #666; font-size: 14px;">Silakan login ke dashboard admin untuk memproses permintaan ini</span>
                </p>
            </div>
            
            <!-- CTA Button -->
            <div style="text-align: center; margin: 35px 0;">
                <a href="{FRONTEND_URL}/admin/share-requests" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 15px 40px; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);">
                    📋 Lihat Permintaan Share
                </a>
            </div>
            
            <!-- Quick Actions -->
            <div style="background: #f8f9fa; border-radius: 8px; padding: 20px; margin: 25px 0;">
                <h3 style="color: #333; font-size: 16px; font-weight: 600; margin: 0 0 15px;">🚀 Langkah Cepat:</h3>
                <ol style="color: #666; font-size: 14px; line-height: 1.8; margin: 0; padding-left: 20px;">
                    <li>Login ke dashboard admin</li>
                    <li>Navigasi ke halaman Share Request Management</li>
                    <li>Review detail permintaan share dari client</li>
                    <li>Proses share ke target yang diminta</li>
                    <li>Update status permintaan (Approved/Completed/Rejected)</li>
                </ol>
            </div>
        </div>
        
        <!-- Footer -->
        <div style="background: #f8f9fa; padding: 30px; text-align: center; color: #666;">
            <p style="margin: 5px 0; font-weight: 600; color: #333;">Rimuru Admin System 🔧</p>
            <p style="margin: 5px 0; font-size: 13px;">(c) 2025 Rimuru. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
    """
    
    success_count = 0
    for admin_email in admin_emails:
        if EmailService.send_email(admin_email, subject, html_content):
            success_count += 1
    
    logger.info(f"Email: Share request notification emails sent to {success_count}/{len(admin_emails)} admins")
    return success_count > 0

def send_client_share_request_approved_email(client_email: str, client_name: str, platform: str, account_name: str) -> bool:
    """Send email to client when share request is approved"""
    platform_display = {
        "facebook": "Facebook Ads",
        "google": "Google Ads",
        "tiktok": "TikTok Ads"
    }.get(platform.lower(), platform.title())
    
    subject = f"🎉 Permintaan Share Akun Disetujui - {account_name}"
    
    html_content = f"""
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f4; font-family: 'Helvetica Neue', Arial, sans-serif;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <!-- Header with Logo -->
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; text-align: center;">
            <img src="{LOGO_URL}" alt="Rimuru" style="width: 120px; height: auto; display: block; margin: 0 auto;" />
        </div>
        
        <!-- Main Content -->
        <div style="padding: 40px 30px;">
            <!-- Success Icon -->
            <div style="text-align: center; margin-bottom: 30px;">
                <div style="background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%); width: 80px; height: 80px; border-radius: 50%; margin: 0 auto; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 15px rgba(76, 175, 80, 0.3);">
                    <span style="font-size: 40px;">🎉</span>
                </div>
            </div>
            
            <h1 style="color: #333; font-size: 28px; font-weight: 700; margin: 0 0 20px; text-align: center;">
                Permintaan Share Disetujui!
            </h1>
            
            <p style="color: #666; font-size: 16px; line-height: 1.6; margin: 0 0 25px;">
                Halo <strong style="color: #333;">{client_name}</strong>,
            </p>
            
            <p style="color: #666; font-size: 16px; line-height: 1.6; margin: 0 0 25px;">
                Permintaan share akun <strong style="color: #667eea;">{platform_display}</strong> Anda telah <strong style="color: #4CAF50;">disetujui</strong> dan sedang diproses! 🎊
            </p>
            
            <!-- Account Details Card -->
            <div style="background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%); border-left: 4px solid #4CAF50; border-radius: 8px; padding: 25px; margin: 25px 0;">
                <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                        <td style="padding: 8px 0; color: #666; font-size: 14px;">
                            <strong style="color: #333;">Platform:</strong>
                        </td>
                        <td style="padding: 8px 0; color: #333; font-size: 14px; text-align: right;">
                            <strong>{platform_display}</strong>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; color: #666; font-size: 14px;">
                            <strong style="color: #333;">Nama Akun:</strong>
                        </td>
                        <td style="padding: 8px 0; color: #333; font-size: 14px; text-align: right;">
                            <strong>{account_name}</strong>
                        </td>
                    </tr>
                </table>
            </div>
            
            <!-- Status Info -->
            <div style="background: linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%); border-radius: 12px; padding: 20px; margin: 25px 0; border-left: 4px solid #ff9800;">
                <p style="margin: 0; color: #e65100; font-size: 15px; line-height: 1.6;">
                    <strong>⏳ Status: Sedang Diproses</strong><br>
                    <span style="color: #666; font-size: 14px;">Tim kami sedang melakukan proses share ke target yang diminta.</span>
                </p>
            </div>
            
            <!-- Timeline -->
            <div style="margin: 30px 0;">
                <h3 style="color: #333; font-size: 18px; font-weight: 600; margin: 0 0 20px;">📋 Proses Share:</h3>
                <div style="border-left: 3px solid #667eea; padding-left: 20px; margin-left: 10px;">
                    <div style="margin-bottom: 20px;">
                        <div style="background: #4CAF50; width: 20px; height: 20px; border-radius: 50%; margin-left: -31px; float: left;"></div>
                        <strong style="color: #4CAF50;">✅ Permintaan Disetujui</strong>
                        <p style="margin: 5px 0; color: #666; font-size: 14px;">Permintaan share Anda telah disetujui oleh admin</p>
                    </div>
                    <div style="margin-bottom: 20px;">
                        <div style="background: #ff9800; width: 20px; height: 20px; border-radius: 50%; margin-left: -31px; float: left;"></div>
                        <strong style="color: #ff9800;">⏳ Sedang Diproses</strong>
                        <p style="margin: 5px 0; color: #666; font-size: 14px;">Tim kami sedang melakukan share akun</p>
                    </div>
                    <div style="margin-bottom: 20px;">
                        <div style="background: #9e9e9e; width: 20px; height: 20px; border-radius: 50%; margin-left: -31px; float: left;"></div>
                        <strong style="color: #666;">🎯 Selesai</strong>
                        <p style="margin: 5px 0; color: #666; font-size: 14px;">Anda akan menerima notifikasi saat share selesai</p>
                    </div>
                </div>
            </div>
            
            <!-- CTA Button -->
            <div style="text-align: center; margin: 35px 0;">
                <a href="{FRONTEND_URL}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 15px 40px; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);">
                    📊 Lihat Status Permintaan
                </a>
            </div>
            
            <!-- Support Info -->
            <div style="background: #f8f9fa; border-radius: 8px; padding: 20px; margin: 25px 0; text-align: center;">
                <p style="margin: 0 0 10px; color: #666; font-size: 14px;">
                    Butuh bantuan? Tim kami siap membantu Anda! 💬
                </p>
                <p style="margin: 0; color: #999; font-size: 13px;">
                    Hubungi kami melalui dashboard Rimuru Anda
                </p>
            </div>
        </div>
        
        <!-- Footer -->
        <div style="background: #f8f9fa; padding: 30px; text-align: center; color: #666;">
            <p style="margin: 5px 0; font-weight: 600; color: #333;">Terima kasih! 🙏</p>
            <p style="margin: 5px 0; font-size: 13px;">(c) 2025 Rimuru. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
    """
    
    return EmailService.send_email(client_email, subject, html_content)

def send_client_share_request_rejected_email(client_email: str, client_name: str, platform: str, account_name: str, reason: str = "") -> bool:
    """Send email to client when share request is rejected"""
    platform_display = {
        "facebook": "Facebook Ads",
        "google": "Google Ads",
        "tiktok": "TikTok Ads"
    }.get(platform.lower(), platform.title())
    
    subject = f"❌ Permintaan Share Akun Ditolak - {account_name}"
    
    reason_html = ""
    if reason:
        reason_html = f"""
            <div style="background: #fff3e0; border-left: 4px solid #ff9800; border-radius: 8px; padding: 20px; margin: 25px 0;">
                <p style="margin: 0 0 8px; color: #e65100; font-weight: 600; font-size: 15px;">📝 Alasan Penolakan:</p>
                <p style="margin: 0; color: #666; font-size: 14px; line-height: 1.6;">{reason}</p>
            </div>
        """
    
    html_content = f"""
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f4; font-family: 'Helvetica Neue', Arial, sans-serif;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <!-- Header with Logo -->
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; text-align: center;">
            <img src="{LOGO_URL}" alt="Rimuru" style="width: 120px; height: auto; display: block; margin: 0 auto;" />
        </div>
        
        <!-- Main Content -->
        <div style="padding: 40px 30px;">
            <!-- Rejection Icon -->
            <div style="text-align: center; margin-bottom: 30px;">
                <div style="background: linear-gradient(135deg, #f44336 0%, #d32f2f 100%); width: 80px; height: 80px; border-radius: 50%; margin: 0 auto; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 15px rgba(244, 67, 54, 0.3);">
                    <span style="font-size: 40px;">❌</span>
                </div>
            </div>
            
            <h1 style="color: #333; font-size: 28px; font-weight: 700; margin: 0 0 20px; text-align: center;">
                Permintaan Share Ditolak
            </h1>
            
            <p style="color: #666; font-size: 16px; line-height: 1.6; margin: 0 0 25px;">
                Halo <strong style="color: #333;">{client_name}</strong>,
            </p>
            
            <p style="color: #666; font-size: 16px; line-height: 1.6; margin: 0 0 25px;">
                Mohon maaf, permintaan share akun <strong style="color: #667eea;">{platform_display}</strong> Anda tidak dapat diproses saat ini.
            </p>
            
            <!-- Account Details Card -->
            <div style="background: linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%); border-left: 4px solid #f44336; border-radius: 8px; padding: 25px; margin: 25px 0;">
                <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                        <td style="padding: 8px 0; color: #666; font-size: 14px;">
                            <strong style="color: #333;">Platform:</strong>
                        </td>
                        <td style="padding: 8px 0; color: #333; font-size: 14px; text-align: right;">
                            <strong>{platform_display}</strong>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; color: #666; font-size: 14px;">
                            <strong style="color: #333;">Nama Akun:</strong>
                        </td>
                        <td style="padding: 8px 0; color: #333; font-size: 14px; text-align: right;">
                            <strong>{account_name}</strong>
                        </td>
                    </tr>
                </table>
            </div>
            
            {reason_html}
            
            <!-- Next Steps -->
            <div style="background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%); border-radius: 12px; padding: 25px; margin: 25px 0; border-left: 4px solid #2196F3;">
                <h3 style="color: #1976d2; font-size: 16px; font-weight: 600; margin: 0 0 15px;">💡 Apa yang Bisa Dilakukan?</h3>
                <ul style="color: #666; font-size: 14px; line-height: 1.8; margin: 0; padding-left: 20px;">
                    <li>Periksa kembali detail target share yang diminta</li>
                    <li>Pastikan informasi target (BM ID/Email/BC ID) sudah benar</li>
                    <li>Hubungi tim support untuk bantuan lebih lanjut</li>
                    <li>Ajukan permintaan share baru dengan informasi yang sudah diperbaiki</li>
                </ul>
            </div>
            
            <!-- CTA Buttons -->
            <div style="text-align: center; margin: 35px 0;">
                <a href="{FRONTEND_URL}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 15px 40px; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3); margin: 5px;">
                    🔄 Ajukan Permintaan Baru
                </a>
                <br><br>
                <a href="{FRONTEND_URL}" style="display: inline-block; background: #ffffff; color: #667eea; text-decoration: none; padding: 15px 40px; border-radius: 8px; font-weight: 600; font-size: 16px; border: 2px solid #667eea; margin: 5px;">
                    💬 Hubungi Support
                </a>
            </div>
            
            <!-- Support Info -->
            <div style="background: #f8f9fa; border-radius: 8px; padding: 20px; margin: 25px 0; text-align: center;">
                <p style="margin: 0 0 10px; color: #666; font-size: 14px;">
                    Butuh bantuan? Tim kami siap membantu Anda! 💬
                </p>
                <p style="margin: 0; color: #999; font-size: 13px;">
                    Hubungi kami melalui dashboard Rimuru Anda
                </p>
            </div>
        </div>
        
        <!-- Footer -->
        <div style="background: #f8f9fa; padding: 30px; text-align: center; color: #666;">
            <p style="margin: 5px 0; font-weight: 600; color: #333;">Terima kasih! 🙏</p>
            <p style="margin: 5px 0; font-size: 13px;">(c) 2025 Rimuru. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
    """
    
    return EmailService.send_email(client_email, subject, html_content)



def send_client_account_request_completed_email(client_email: str, client_name: str, platform: str, account_name: str) -> bool:
    """Send email to client when account request is completed (share finished, account active)"""
    platform_display = {
        "facebook": "Facebook Ads",
        "google": "Google Ads",
        "tiktok": "TikTok Ads"
    }.get(platform.lower(), platform.title())
    
    subject = f"✅ Akun {platform_display} Aktif - {account_name}"
    
    html_content = f"""
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f4; font-family: 'Helvetica Neue', Arial, sans-serif;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <!-- Header with Logo -->
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; text-align: center;">
            <img src="{LOGO_URL}" alt="Rimuru" style="width: 120px; height: auto; display: block; margin: 0 auto;" />
        </div>
        
        <!-- Main Content -->
        <div style="padding: 40px 30px;">
            <!-- Success Icon -->
            <div style="text-align: center; margin-bottom: 30px;">
                <div style="background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%); width: 80px; height: 80px; border-radius: 50%; margin: 0 auto; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 15px rgba(76, 175, 80, 0.3);">
                    <span style="font-size: 40px;">✅</span>
                </div>
            </div>
            
            <h1 style="color: #333; font-size: 28px; font-weight: 700; margin: 0 0 20px; text-align: center;">
                Akun Aktif dan Siap Digunakan!
            </h1>
            
            <p style="color: #666; font-size: 16px; line-height: 1.6; margin: 0 0 25px;">
                Halo <strong style="color: #333;">{client_name}</strong>,
            </p>
            
            <p style="color: #666; font-size: 16px; line-height: 1.6; margin: 0 0 25px;">
                Selamat! Proses share akun <strong style="color: #667eea;">{platform_display}</strong> Anda telah <strong style="color: #4CAF50;">selesai</strong>. Akun Anda sekarang sudah aktif dan siap digunakan! 🎊
            </p>
            
            <!-- Account Details Card -->
            <div style="background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%); border-left: 4px solid #4CAF50; border-radius: 8px; padding: 25px; margin: 25px 0;">
                <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                        <td style="padding: 8px 0; color: #666; font-size: 14px;">
                            <strong style="color: #333;">Platform:</strong>
                        </td>
                        <td style="padding: 8px 0; color: #333; font-size: 14px; text-align: right;">
                            <strong>{platform_display}</strong>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; color: #666; font-size: 14px;">
                            <strong style="color: #333;">Nama Akun:</strong>
                        </td>
                        <td style="padding: 8px 0; color: #333; font-size: 14px; text-align: right;">
                            <strong>{account_name}</strong>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; color: #666; font-size: 14px;">
                            <strong style="color: #333;">Status:</strong>
                        </td>
                        <td style="padding: 8px 0; color: #4CAF50; font-size: 14px; text-align: right;">
                            <strong>✅ Aktif</strong>
                        </td>
                    </tr>
                </table>
            </div>
            
            <!-- What's Next -->
            <div style="margin: 30px 0;">
                <h3 style="color: #333; font-size: 18px; font-weight: 600; margin: 0 0 15px;">🎯 Apa Selanjutnya?</h3>
                <ol style="color: #666; font-size: 15px; line-height: 1.8; margin: 0; padding-left: 20px;">
                    <li>Akun Anda sudah aktif dan dapat digunakan untuk menjalankan iklan</li>
                    <li>Anda dapat melakukan top-up saldo untuk akun ini</li>
                    <li>Mulai kelola iklan Anda melalui platform {platform_display}</li>
                    <li>Monitor saldo dan transaksi melalui dashboard Rimuru</li>
                </ol>
            </div>
            
            <!-- CTA Button -->
            <div style="text-align: center; margin: 35px 0;">
                <a href="{FRONTEND_URL}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 15px 40px; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);">
                    💰 Top-Up Saldo Sekarang
                </a>
            </div>
            
            <!-- Success Message -->
            <div style="background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%); border-radius: 12px; padding: 20px; margin: 25px 0; border-left: 4px solid #4CAF50; text-align: center;">
                <p style="margin: 0; color: #2e7d32; font-size: 16px; line-height: 1.6; font-weight: 600;">
                    🎉 Terima kasih telah menggunakan Rimuru!
                </p>
                <p style="margin: 10px 0 0; color: #666; font-size: 14px;">
                    Tim kami siap membantu Anda mencapai kesuksesan dalam menjalankan iklan digital
                </p>
            </div>
            
            <!-- Support Info -->
            <div style="background: #f8f9fa; border-radius: 8px; padding: 20px; margin: 25px 0; text-align: center;">
                <p style="margin: 0 0 10px; color: #666; font-size: 14px;">
                    Butuh bantuan? Tim kami siap membantu Anda! 💬
                </p>
                <p style="margin: 0; color: #999; font-size: 13px;">
                    Hubungi kami melalui dashboard Rimuru Anda
                </p>
            </div>
        </div>
        
        <!-- Footer -->
        <div style="background: #f8f9fa; padding: 30px; text-align: center; color: #666;">
            <p style="margin: 5px 0; font-weight: 600; color: #333;">Terima kasih telah menggunakan Rimuru! 🙏</p>
            <p style="margin: 5px 0; font-size: 13px;">© 2025 Rimuru. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
    """
    
    return EmailService.send_email(client_email, subject, html_content)



# ==================== PHASE 1 CRITICAL EMAIL NOTIFICATIONS ====================

def send_client_wallet_topup_approved_email(client_email: str, client_name: str, amount: float, currency: str, wallet_type: str) -> bool:
    """Send email to client when wallet top-up is approved"""
    currency_symbol = "Rp" if currency == "IDR" else "$"
    formatted_amount = f"{currency_symbol} {amount:,.0f}"
    wallet_display = f"{wallet_type.replace('_', ' ').title()} Wallet"
    
    subject = f"✅ Wallet Top-Up Disetujui - {formatted_amount}"
    
    html_content = f"""
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f4; font-family: 'Helvetica Neue', Arial, sans-serif;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; text-align: center;">
            <img src="{LOGO_URL}" alt="Rimuru" style="width: 120px; height: auto; display: block; margin: 0 auto;" />
        </div>
        
        <div style="padding: 40px 30px;">
            <div style="text-align: center; margin-bottom: 30px;">
                <div style="background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%); width: 80px; height: 80px; border-radius: 50%; margin: 0 auto; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 15px rgba(76, 175, 80, 0.3);">
                    <span style="font-size: 40px;">✅</span>
                </div>
            </div>
            
            <h1 style="color: #333; font-size: 28px; font-weight: 700; margin: 0 0 20px; text-align: center;">
                Wallet Top-Up Berhasil!
            </h1>
            
            <p style="color: #666; font-size: 16px; line-height: 1.6; margin: 0 0 25px;">
                Halo <strong style="color: #333;">{client_name}</strong>,
            </p>
            
            <p style="color: #666; font-size: 16px; line-height: 1.6; margin: 0 0 25px;">
                Permintaan top-up wallet Anda telah <strong style="color: #4CAF50;">disetujui</strong>! Saldo telah ditambahkan ke wallet Anda. 🎉
            </p>
            
            <div style="background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%); border-left: 4px solid #4CAF50; border-radius: 8px; padding: 25px; margin: 25px 0;">
                <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                        <td style="padding: 8px 0; color: #666; font-size: 14px;">
                            <strong style="color: #333;">💰 Jumlah:</strong>
                        </td>
                        <td style="padding: 8px 0; color: #4CAF50; font-size: 18px; text-align: right;">
                            <strong>{formatted_amount}</strong>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; color: #666; font-size: 14px;">
                            <strong style="color: #333;">💵 Mata Uang:</strong>
                        </td>
                        <td style="padding: 8px 0; color: #333; font-size: 14px; text-align: right;">
                            <strong>{currency}</strong>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; color: #666; font-size: 14px;">
                            <strong style="color: #333;">👛 Wallet:</strong>
                        </td>
                        <td style="padding: 8px 0; color: #333; font-size: 14px; text-align: right;">
                            <strong>{wallet_display}</strong>
                        </td>
                    </tr>
                </table>
            </div>
            
            <div style="margin: 30px 0;">
                <h3 style="color: #333; font-size: 18px; font-weight: 600; margin: 0 0 15px;">💡 Apa Selanjutnya?</h3>
                <ul style="color: #666; font-size: 15px; line-height: 1.8; margin: 0; padding-left: 20px;">
                    <li>Saldo wallet Anda sudah bertambah</li>
                    <li>Anda dapat menggunakan saldo ini untuk transfer ke akun iklan</li>
                    <li>Cek wallet statement untuk detail transaksi</li>
                </ul>
            </div>
            
            <div style="text-align: center; margin: 35px 0;">
                <a href="{FRONTEND_URL}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 15px 40px; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);">
                    👛 Lihat Wallet Saya
                </a>
            </div>
        </div>
        
        <div style="background: #f8f9fa; padding: 30px; text-align: center; color: #666;">
            <p style="margin: 5px 0; font-weight: 600; color: #333;">Terima kasih! 🙏</p>
            <p style="margin: 5px 0; font-size: 13px;">© 2025 Rimuru. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
    """
    
    return EmailService.send_email(client_email, subject, html_content)


def send_client_wallet_topup_rejected_email(client_email: str, client_name: str, amount: float, currency: str, wallet_type: str, reason: str = "") -> bool:
    """Send email to client when wallet top-up is rejected"""
    currency_symbol = "Rp" if currency == "IDR" else "$"
    formatted_amount = f"{currency_symbol} {amount:,.0f}"
    wallet_display = f"{wallet_type.replace('_', ' ').title()} Wallet"
    
    subject = f"❌ Wallet Top-Up Ditolak - {formatted_amount}"
    
    reason_html = ""
    if reason:
        reason_html = f"""
            <div style="background: #fff3e0; border-left: 4px solid #ff9800; border-radius: 8px; padding: 20px; margin: 25px 0;">
                <p style="margin: 0 0 8px; color: #e65100; font-weight: 600; font-size: 15px;">📝 Alasan Penolakan:</p>
                <p style="margin: 0; color: #666; font-size: 14px; line-height: 1.6;">{reason}</p>
            </div>
        """
    
    html_content = f"""
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f4; font-family: 'Helvetica Neue', Arial, sans-serif;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; text-align: center;">
            <img src="{LOGO_URL}" alt="Rimuru" style="width: 120px; height: auto; display: block; margin: 0 auto;" />
        </div>
        
        <div style="padding: 40px 30px;">
            <div style="text-align: center; margin-bottom: 30px;">
                <div style="background: linear-gradient(135deg, #f44336 0%, #d32f2f 100%); width: 80px; height: 80px; border-radius: 50%; margin: 0 auto; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 15px rgba(244, 67, 54, 0.3);">
                    <span style="font-size: 40px;">❌</span>
                </div>
            </div>
            
            <h1 style="color: #333; font-size: 28px; font-weight: 700; margin: 0 0 20px; text-align: center;">
                Wallet Top-Up Ditolak
            </h1>
            
            <p style="color: #666; font-size: 16px; line-height: 1.6; margin: 0 0 25px;">
                Halo <strong style="color: #333;">{client_name}</strong>,
            </p>
            
            <p style="color: #666; font-size: 16px; line-height: 1.6; margin: 0 0 25px;">
                Mohon maaf, permintaan top-up wallet Anda tidak dapat disetujui saat ini.
            </p>
            
            <div style="background: linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%); border-left: 4px solid #f44336; border-radius: 8px; padding: 25px; margin: 25px 0;">
                <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                        <td style="padding: 8px 0; color: #666; font-size: 14px;">
                            <strong style="color: #333;">💰 Jumlah:</strong>
                        </td>
                        <td style="padding: 8px 0; color: #333; font-size: 14px; text-align: right;">
                            <strong>{formatted_amount}</strong>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; color: #666; font-size: 14px;">
                            <strong style="color: #333;">💵 Mata Uang:</strong>
                        </td>
                        <td style="padding: 8px 0; color: #333; font-size: 14px; text-align: right;">
                            <strong>{currency}</strong>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; color: #666; font-size: 14px;">
                            <strong style="color: #333;">👛 Wallet:</strong>
                        </td>
                        <td style="padding: 8px 0; color: #333; font-size: 14px; text-align: right;">
                            <strong>{wallet_display}</strong>
                        </td>
                    </tr>
                </table>
            </div>
            
            {reason_html}
            
            <div style="background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%); border-radius: 12px; padding: 25px; margin: 25px 0; border-left: 4px solid #2196F3;">
                <h3 style="color: #1976d2; font-size: 16px; font-weight: 600; margin: 0 0 15px;">💡 Apa yang Bisa Dilakukan?</h3>
                <ul style="color: #666; font-size: 14px; line-height: 1.8; margin: 0; padding-left: 20px;">
                    <li>Periksa bukti pembayaran yang diupload</li>
                    <li>Pastikan jumlah transfer sesuai</li>
                    <li>Hubungi support untuk bantuan lebih lanjut</li>
                    <li>Ajukan permintaan top-up baru dengan informasi yang benar</li>
                </ul>
            </div>
            
            <div style="text-align: center; margin: 35px 0;">
                <a href="{FRONTEND_URL}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 15px 40px; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);">
                    🔄 Ajukan Top-Up Baru
                </a>
            </div>
        </div>
        
        <div style="background: #f8f9fa; padding: 30px; text-align: center; color: #666;">
            <p style="margin: 5px 0; font-weight: 600; color: #333;">Terima kasih! 🙏</p>
            <p style="margin: 5px 0; font-size: 13px;">© 2025 Rimuru. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
    """
    
    return EmailService.send_email(client_email, subject, html_content)


def send_admin_wallet_topup_proof_uploaded_email(admin_emails: list, client_name: str, amount: float, currency: str, wallet_type: str) -> bool:
    """Send email to admins when client uploads wallet top-up proof"""
    if not admin_emails:
        return False
    
    currency_symbol = "Rp" if currency == "IDR" else "$"
    formatted_amount = f"{currency_symbol} {amount:,.0f}"
    wallet_display = f"{wallet_type.replace('_', ' ').title()} Wallet"
    
    subject = f"🔔 Bukti Wallet Top-Up Diupload - {formatted_amount}"
    
    html_content = f"""
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f4; font-family: 'Helvetica Neue', Arial, sans-serif;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; text-align: center;">
            <img src="{LOGO_URL}" alt="Rimuru" style="width: 120px; height: auto; display: block; margin: 0 auto;" />
        </div>
        
        <div style="padding: 40px 30px;">
            <div style="text-align: center; margin-bottom: 30px;">
                <div style="background: linear-gradient(135deg, #ff9800 0%, #f57c00 100%); width: 80px; height: 80px; border-radius: 50%; margin: 0 auto; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 15px rgba(255, 152, 0, 0.3);">
                    <span style="font-size: 40px;">🔔</span>
                </div>
            </div>
            
            <h1 style="color: #333; font-size: 28px; font-weight: 700; margin: 0 0 20px; text-align: center;">
                Bukti Top-Up Diupload!
            </h1>
            
            <p style="color: #666; font-size: 16px; line-height: 1.6; margin: 0 0 25px; text-align: center;">
                Client telah mengupload bukti pembayaran untuk wallet top-up
            </p>
            
            <div style="background: linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%); border-left: 4px solid #ff9800; border-radius: 8px; padding: 25px; margin: 25px 0;">
                <h3 style="color: #e65100; font-size: 16px; font-weight: 600; margin: 0 0 15px;">📋 Detail Top-Up</h3>
                <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                        <td style="padding: 8px 0; color: #666; font-size: 14px;">
                            <strong style="color: #333;">👤 Client:</strong>
                        </td>
                        <td style="padding: 8px 0; color: #333; font-size: 14px; text-align: right;">
                            <strong>{client_name}</strong>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; color: #666; font-size: 14px;">
                            <strong style="color: #333;">💰 Jumlah:</strong>
                        </td>
                        <td style="padding: 8px 0; color: #ff9800; font-size: 18px; text-align: right;">
                            <strong>{formatted_amount}</strong>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; color: #666; font-size: 14px;">
                            <strong style="color: #333;">💵 Mata Uang:</strong>
                        </td>
                        <td style="padding: 8px 0; color: #333; font-size: 14px; text-align: right;">
                            <strong>{currency}</strong>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; color: #666; font-size: 14px;">
                            <strong style="color: #333;">👛 Wallet:</strong>
                        </td>
                        <td style="padding: 8px 0; color: #333; font-size: 14px; text-align: right;">
                            <strong>{wallet_display}</strong>
                        </td>
                    </tr>
                </table>
            </div>
            
            <div style="background: linear-gradient(135deg, #fff3cd 0%, #fff 100%); border-radius: 12px; padding: 20px; margin: 25px 0; border-left: 4px solid #ffc107;">
                <p style="margin: 0; color: #856404; font-size: 15px; line-height: 1.6;">
                    <strong>⚡ Tindakan Diperlukan</strong><br>
                    <span style="color: #666; font-size: 14px;">Silakan verifikasi bukti pembayaran dan approve/reject top-up request</span>
                </p>
            </div>
            
            <div style="text-align: center; margin: 35px 0;">
                <a href="{FRONTEND_URL}/admin/wallet-topup" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 15px 40px; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);">
                    📋 Verifikasi Top-Up
                </a>
            </div>
        </div>
        
        <div style="background: #f8f9fa; padding: 30px; text-align: center; color: #666;">
            <p style="margin: 5px 0; font-weight: 600; color: #333;">Rimuru Admin System 🔧</p>
            <p style="margin: 5px 0; font-size: 13px;">© 2025 Rimuru. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
    """
    
    success_count = 0
    for admin_email in admin_emails:
        if EmailService.send_email(admin_email, subject, html_content):
            success_count += 1
    
    logger.info(f"📧 Wallet top-up proof uploaded notification sent to {success_count}/{len(admin_emails)} admins")
    return success_count > 0


def send_client_topup_auto_cancelled_email(client_email: str, client_name: str, amount: float, currency: str, account_name: str, platform: str) -> bool:
    """Send email to client when top-up is auto-cancelled due to expiration"""
    currency_symbol = "Rp" if currency == "IDR" else "$"
    formatted_amount = f"{currency_symbol} {amount:,.0f}"
    
    platform_display = {
        "facebook": "Facebook Ads",
        "google": "Google Ads",
        "tiktok": "TikTok Ads"
    }.get(platform.lower(), platform.title())
    
    subject = f"⏰ Top-Up Dibatalkan Otomatis - {formatted_amount}"
    
    html_content = f"""
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f4; font-family: 'Helvetica Neue', Arial, sans-serif;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; text-align: center;">
            <img src="{LOGO_URL}" alt="Rimuru" style="width: 120px; height: auto; display: block; margin: 0 auto;" />
        </div>
        
        <div style="padding: 40px 30px;">
            <div style="text-align: center; margin-bottom: 30px;">
                <div style="background: linear-gradient(135deg, #ff9800 0%, #f57c00 100%); width: 80px; height: 80px; border-radius: 50%; margin: 0 auto; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 15px rgba(255, 152, 0, 0.3);">
                    <span style="font-size: 40px;">⏰</span>
                </div>
            </div>
            
            <h1 style="color: #333; font-size: 28px; font-weight: 700; margin: 0 0 20px; text-align: center;">
                Top-Up Dibatalkan Otomatis
            </h1>
            
            <p style="color: #666; font-size: 16px; line-height: 1.6; margin: 0 0 25px;">
                Halo <strong style="color: #333;">{client_name}</strong>,
            </p>
            
            <p style="color: #666; font-size: 16px; line-height: 1.6; margin: 0 0 25px;">
                Permintaan top-up Anda telah <strong style="color: #ff9800;">dibatalkan otomatis</strong> karena melewati batas waktu verifikasi.
            </p>
            
            <div style="background: linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%); border-left: 4px solid #ff9800; border-radius: 8px; padding: 25px; margin: 25px 0;">
                <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                        <td style="padding: 8px 0; color: #666; font-size: 14px;">
                            <strong style="color: #333;">💰 Jumlah:</strong>
                        </td>
                        <td style="padding: 8px 0; color: #333; font-size: 14px; text-align: right;">
                            <strong>{formatted_amount}</strong>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; color: #666; font-size: 14px;">
                            <strong style="color: #333;">📱 Platform:</strong>
                        </td>
                        <td style="padding: 8px 0; color: #333; font-size: 14px; text-align: right;">
                            <strong>{platform_display}</strong>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; color: #666; font-size: 14px;">
                            <strong style="color: #333;">📊 Akun:</strong>
                        </td>
                        <td style="padding: 8px 0; color: #333; font-size: 14px; text-align: right;">
                            <strong>{account_name}</strong>
                        </td>
                    </tr>
                </table>
            </div>
            
            <div style="background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%); border-radius: 12px; padding: 25px; margin: 25px 0; border-left: 4px solid #2196F3;">
                <h3 style="color: #1976d2; font-size: 16px; font-weight: 600; margin: 0 0 15px;">💡 Kenapa Dibatalkan?</h3>
                <p style="color: #666; font-size: 14px; line-height: 1.6; margin: 0 0 10px;">
                    Top-up request dibatalkan otomatis jika tidak diverifikasi oleh admin dalam waktu yang ditentukan. Hal ini untuk menjaga keakuratan data transaksi.
                </p>
                <h3 style="color: #1976d2; font-size: 16px; font-weight: 600; margin: 15px 0;">🔄 Apa yang Harus Dilakukan?</h3>
                <ul style="color: #666; font-size: 14px; line-height: 1.8; margin: 0; padding-left: 20px;">
                    <li>Ajukan permintaan top-up baru</li>
                    <li>Upload bukti pembayaran dengan jelas</li>
                    <li>Tunggu verifikasi dari admin</li>
                </ul>
            </div>
            
            <div style="text-align: center; margin: 35px 0;">
                <a href="{FRONTEND_URL}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 15px 40px; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);">
                    🔄 Ajukan Top-Up Baru
                </a>
            </div>
        </div>
        
        <div style="background: #f8f9fa; padding: 30px; text-align: center; color: #666;">
            <p style="margin: 5px 0; font-weight: 600; color: #333;">Terima kasih! 🙏</p>
            <p style="margin: 5px 0; font-size: 13px;">© 2025 Rimuru. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
    """
    
    return EmailService.send_email(client_email, subject, html_content)



def send_client_wallet_topup_auto_cancelled_email(client_email: str, client_name: str, amount: float, currency: str, wallet_type: str) -> bool:
    """Send email to client when wallet top-up is auto-cancelled due to expiration"""
    currency_symbol = "Rp" if currency == "IDR" else "$"
    formatted_amount = f"{currency_symbol} {amount:,.0f}"
    
    wallet_display = "Main Wallet" if wallet_type == "main" else "Withdrawal Wallet"
    
    subject = f"⏰ Wallet Top-Up Dibatalkan Otomatis - {formatted_amount}"
    
    html_content = f"""
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f4; font-family: 'Helvetica Neue', Arial, sans-serif;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; text-align: center;">
            <img src="{LOGO_URL}" alt="Rimuru" style="width: 120px; height: auto; display: block; margin: 0 auto;" />
        </div>
        
        <div style="padding: 40px 30px;">
            <div style="text-align: center; margin-bottom: 30px;">
                <div style="background: linear-gradient(135deg, #ff9800 0%, #f57c00 100%); width: 80px; height: 80px; border-radius: 50%; margin: 0 auto; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 15px rgba(255, 152, 0, 0.3);">
                    <span style="font-size: 40px;">⏰</span>
                </div>
            </div>
            
            <h1 style="color: #333; font-size: 28px; font-weight: 700; margin: 0 0 20px; text-align: center;">
                Wallet Top-Up Dibatalkan Otomatis
            </h1>
            
            <p style="color: #666; font-size: 16px; line-height: 1.6; margin: 0 0 25px;">
                Halo <strong style="color: #333;">{client_name}</strong>,
            </p>
            
            <p style="color: #666; font-size: 16px; line-height: 1.6; margin: 0 0 25px;">
                Permintaan top-up wallet Anda telah <strong style="color: #ff9800;">dibatalkan otomatis</strong> karena belum ada bukti pembayaran dalam 24 jam.
            </p>
            
            <div style="background: linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%); border-left: 4px solid #ff9800; border-radius: 8px; padding: 25px; margin: 25px 0;">
                <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                        <td style="padding: 8px 0; color: #666; font-size: 14px;">
                            <strong style="color: #333;">💰 Jumlah:</strong>
                        </td>
                        <td style="padding: 8px 0; color: #333; font-size: 14px; text-align: right;">
                            <strong>{formatted_amount}</strong>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; color: #666; font-size: 14px;">
                            <strong style="color: #333;">💳 Wallet:</strong>
                        </td>
                        <td style="padding: 8px 0; color: #333; font-size: 14px; text-align: right;">
                            <strong>{wallet_display}</strong>
                        </td>
                    </tr>
                </table>
            </div>
            
            <div style="background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%); border-radius: 12px; padding: 25px; margin: 25px 0; border-left: 4px solid #2196F3;">
                <h3 style="color: #1976d2; font-size: 16px; font-weight: 600; margin: 0 0 15px;">💡 Kenapa Dibatalkan?</h3>
                <p style="color: #666; font-size: 14px; line-height: 1.6; margin: 0 0 10px;">
                    Top-up wallet otomatis dibatalkan jika belum ada bukti pembayaran yang diupload dalam waktu 24 jam. Hal ini untuk menjaga keakuratan data transaksi dan menghindari penumpukan request.
                </p>
                <h3 style="color: #1976d2; font-size: 16px; font-weight: 600; margin: 15px 0;">🔄 Apa yang Harus Dilakukan?</h3>
                <ul style="color: #666; font-size: 14px; line-height: 1.8; margin: 0; padding-left: 20px;">
                    <li>Ajukan permintaan top-up wallet baru</li>
                    <li>Upload bukti pembayaran segera setelah transfer</li>
                    <li>Pastikan bukti jelas dan nominal sesuai</li>
                    <li>Tunggu verifikasi dari admin</li>
                </ul>
            </div>
            
            <div style="text-align: center; margin: 35px 0;">
                <a href="{FRONTEND_URL}/dashboard/wallet/topup" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 15px 40px; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);">
                    🔄 Ajukan Top-Up Wallet Baru
                </a>
            </div>
        </div>
        
        <div style="background: #f8f9fa; padding: 30px; text-align: center; color: #666;">
            <p style="margin: 5px 0; font-weight: 600; color: #333;">Terima kasih! 🙏</p>
            <p style="margin: 5px 0; font-size: 13px;">© 2025 Rimuru. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
    """
    
    return EmailService.send_email(client_email, subject, html_content)


def send_client_super_admin_completion_email(client_email: str, client_name: str, action_type: str, amount: float = None, currency: str = None, details: str = "") -> bool:
    """
    Generic email for super admin action completions
    action_type: 'wallet_topup', 'withdrawal', 'wallet_transfer'
    """
    
    action_titles = {
        'wallet_topup': ('✅ Wallet Top-Up Selesai', '💰', 'Wallet top-up Anda telah selesai diproses'),
        'withdrawal': ('✅ Penarikan Selesai', '💸', 'Penarikan saldo Anda telah selesai diproses'),
        'wallet_transfer': ('✅ Transfer Wallet Selesai', '🔄', 'Transfer wallet Anda telah selesai diproses')
    }
    
    title, icon, description = action_titles.get(action_type, ('✅ Transaksi Selesai', '✅', 'Transaksi Anda telah selesai'))
    
    subject = title
    
    amount_html = ""
    if amount and currency:
        currency_symbol = "Rp" if currency == "IDR" else "$"
        formatted_amount = f"{currency_symbol} {amount:,.0f}"
        amount_html = f"""
            <div style="background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%); border: 2px solid #4CAF50; border-radius: 12px; padding: 25px; text-align: center; margin: 25px 0;">
                <p style="margin: 0 0 8px; color: #666; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">JUMLAH</p>
                <div style="font-size: 32px; font-weight: 800; color: #4CAF50; margin: 5px 0;">{formatted_amount}</div>
            </div>
        """
    
    details_html = ""
    if details:
        details_html = f"""
            <div style="background: #f8f9fa; border-radius: 8px; padding: 20px; margin: 25px 0;">
                <p style="margin: 0; color: #666; font-size: 14px; line-height: 1.6;">{details}</p>
            </div>
        """
    
    html_content = f"""
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f4; font-family: 'Helvetica Neue', Arial, sans-serif;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; text-align: center;">
            <img src="{LOGO_URL}" alt="Rimuru" style="width: 120px; height: auto; display: block; margin: 0 auto;" />
        </div>
        
        <div style="padding: 40px 30px;">
            <div style="text-align: center; margin-bottom: 30px;">
                <div style="background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%); width: 80px; height: 80px; border-radius: 50%; margin: 0 auto; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 15px rgba(76, 175, 80, 0.3);">
                    <span style="font-size: 40px;">{icon}</span>
                </div>
            </div>
            
            <h1 style="color: #333; font-size: 28px; font-weight: 700; margin: 0 0 20px; text-align: center;">
                {title}
            </h1>
            
            <p style="color: #666; font-size: 16px; line-height: 1.6; margin: 0 0 25px;">
                Halo <strong style="color: #333;">{client_name}</strong>,
            </p>
            
            <p style="color: #666; font-size: 16px; line-height: 1.6; margin: 0 0 25px;">
                {description}. Semua proses telah diselesaikan dengan sukses! 🎉
            </p>
            
            {amount_html}
            {details_html}
            
            <div style="background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%); border-radius: 12px; padding: 20px; margin: 25px 0; border-left: 4px solid #4CAF50; text-align: center;">
                <p style="margin: 0; color: #2e7d32; font-size: 16px; line-height: 1.6; font-weight: 600;">
                    ✅ Transaksi Berhasil Diselesaikan
                </p>
                <p style="margin: 10px 0 0; color: #666; font-size: 14px;">
                    Silakan cek dashboard untuk detail lengkap
                </p>
            </div>
            
            <div style="text-align: center; margin: 35px 0;">
                <a href="{FRONTEND_URL}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 15px 40px; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);">
                    📊 Lihat Dashboard
                </a>
            </div>
        </div>
        
        <div style="background: #f8f9fa; padding: 30px; text-align: center; color: #666;">
            <p style="margin: 5px 0; font-weight: 600; color: #333;">Terima kasih! 🙏</p>
            <p style="margin: 5px 0; font-size: 13px;">© 2025 Rimuru. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
    """
    
    return EmailService.send_email(client_email, subject, html_content)



# ==================== PHASE 2 IMPORTANT EMAIL NOTIFICATIONS ====================

def send_client_transfer_request_success_email(client_email: str, client_name: str, amount: float, currency: str, from_account: str, to_account: str) -> bool:
    """Send email to client when balance transfer request succeeds"""
    currency_symbol = "Rp" if currency == "IDR" else "$"
    formatted_amount = f"{currency_symbol} {amount:,.0f}"
    
    subject = f"✅ Transfer Saldo Berhasil - {formatted_amount}"
    
    html_content = f"""
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f4; font-family: 'Helvetica Neue', Arial, sans-serif;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; text-align: center;">
            <img src="{LOGO_URL}" alt="Rimuru" style="width: 120px; height: auto; display: block; margin: 0 auto;" />
        </div>
        
        <div style="padding: 40px 30px;">
            <div style="text-align: center; margin-bottom: 30px;">
                <div style="background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%); width: 80px; height: 80px; border-radius: 50%; margin: 0 auto; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 15px rgba(76, 175, 80, 0.3);">
                    <span style="font-size: 40px;">✅</span>
                </div>
            </div>
            
            <h1 style="color: #333; font-size: 28px; font-weight: 700; margin: 0 0 20px; text-align: center;">
                Transfer Saldo Berhasil!
            </h1>
            
            <p style="color: #666; font-size: 16px; line-height: 1.6; margin: 0 0 25px;">
                Halo <strong style="color: #333;">{client_name}</strong>,
            </p>
            
            <p style="color: #666; font-size: 16px; line-height: 1.6; margin: 0 0 25px;">
                Transfer saldo antar akun Anda telah <strong style="color: #4CAF50;">berhasil</strong> dilakukan! 🎉
            </p>
            
            <div style="background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%); border-left: 4px solid #4CAF50; border-radius: 8px; padding: 25px; margin: 25px 0;">
                <h3 style="color: #2e7d32; font-size: 16px; font-weight: 600; margin: 0 0 15px;">💸 Detail Transfer</h3>
                <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                        <td style="padding: 8px 0; color: #666; font-size: 14px;">
                            <strong style="color: #333;">💰 Jumlah:</strong>
                        </td>
                        <td style="padding: 8px 0; color: #4CAF50; font-size: 18px; text-align: right;">
                            <strong>{formatted_amount}</strong>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; color: #666; font-size: 14px;">
                            <strong style="color: #333;">📤 Dari Akun:</strong>
                        </td>
                        <td style="padding: 8px 0; color: #333; font-size: 14px; text-align: right;">
                            <strong>{from_account}</strong>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; color: #666; font-size: 14px;">
                            <strong style="color: #333;">📥 Ke Akun:</strong>
                        </td>
                        <td style="padding: 8px 0; color: #333; font-size: 14px; text-align: right;">
                            <strong>{to_account}</strong>
                        </td>
                    </tr>
                </table>
            </div>
            
            <div style="text-align: center; margin: 35px 0;">
                <a href="{FRONTEND_URL}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 15px 40px; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);">
                    📊 Lihat Akun Saya
                </a>
            </div>
        </div>
        
        <div style="background: #f8f9fa; padding: 30px; text-align: center; color: #666;">
            <p style="margin: 5px 0; font-weight: 600; color: #333;">Terima kasih! 🙏</p>
            <p style="margin: 5px 0; font-size: 13px;">© 2025 Rimuru. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
    """
    
    return EmailService.send_email(client_email, subject, html_content)


def send_client_transfer_request_failed_email(client_email: str, client_name: str, amount: float, currency: str, from_account: str, to_account: str, reason: str = "") -> bool:
    """Send email to client when balance transfer request fails"""
    currency_symbol = "Rp" if currency == "IDR" else "$"
    formatted_amount = f"{currency_symbol} {amount:,.0f}"
    
    subject = f"❌ Transfer Saldo Gagal - {formatted_amount}"
    
    reason_html = ""
    if reason:
        reason_html = f"""
            <div style="background: #fff3e0; border-left: 4px solid #ff9800; border-radius: 8px; padding: 20px; margin: 25px 0;">
                <p style="margin: 0 0 8px; color: #e65100; font-weight: 600; font-size: 15px;">📝 Alasan Gagal:</p>
                <p style="margin: 0; color: #666; font-size: 14px; line-height: 1.6;">{reason}</p>
            </div>
        """
    
    html_content = f"""
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f4; font-family: 'Helvetica Neue', Arial, sans-serif;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; text-align: center;">
            <img src="{LOGO_URL}" alt="Rimuru" style="width: 120px; height: auto; display: block; margin: 0 auto;" />
        </div>
        
        <div style="padding: 40px 30px;">
            <div style="text-align: center; margin-bottom: 30px;">
                <div style="background: linear-gradient(135deg, #f44336 0%, #d32f2f 100%); width: 80px; height: 80px; border-radius: 50%; margin: 0 auto; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 15px rgba(244, 67, 54, 0.3);">
                    <span style="font-size: 40px;">❌</span>
                </div>
            </div>
            
            <h1 style="color: #333; font-size: 28px; font-weight: 700; margin: 0 0 20px; text-align: center;">
                Transfer Saldo Gagal
            </h1>
            
            <p style="color: #666; font-size: 16px; line-height: 1.6; margin: 0 0 25px;">
                Halo <strong style="color: #333;">{client_name}</strong>,
            </p>
            
            <p style="color: #666; font-size: 16px; line-height: 1.6; margin: 0 0 25px;">
                Mohon maaf, transfer saldo antar akun Anda <strong style="color: #f44336;">gagal</strong> diproses.
            </p>
            
            <div style="background: linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%); border-left: 4px solid #f44336; border-radius: 8px; padding: 25px; margin: 25px 0;">
                <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                        <td style="padding: 8px 0; color: #666; font-size: 14px;">
                            <strong style="color: #333;">💰 Jumlah:</strong>
                        </td>
                        <td style="padding: 8px 0; color: #333; font-size: 14px; text-align: right;">
                            <strong>{formatted_amount}</strong>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; color: #666; font-size: 14px;">
                            <strong style="color: #333;">📤 Dari Akun:</strong>
                        </td>
                        <td style="padding: 8px 0; color: #333; font-size: 14px; text-align: right;">
                            <strong>{from_account}</strong>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; color: #666; font-size: 14px;">
                            <strong style="color: #333;">📥 Ke Akun:</strong>
                        </td>
                        <td style="padding: 8px 0; color: #333; font-size: 14px; text-align: right;">
                            <strong>{to_account}</strong>
                        </td>
                    </tr>
                </table>
            </div>
            
            {reason_html}
            
            <div style="background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%); border-radius: 12px; padding: 25px; margin: 25px 0; border-left: 4px solid #2196F3;">
                <h3 style="color: #1976d2; font-size: 16px; font-weight: 600; margin: 0 0 15px;">💡 Apa yang Bisa Dilakukan?</h3>
                <ul style="color: #666; font-size: 14px; line-height: 1.8; margin: 0; padding-left: 20px;">
                    <li>Periksa saldo akun sumber mencukupi</li>
                    <li>Pastikan kedua akun aktif dan tidak diblokir</li>
                    <li>Hubungi support untuk bantuan lebih lanjut</li>
                    <li>Coba ajukan transfer ulang</li>
                </ul>
            </div>
            
            <div style="text-align: center; margin: 35px 0;">
                <a href="{FRONTEND_URL}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 15px 40px; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);">
                    💬 Hubungi Support
                </a>
            </div>
        </div>
        
        <div style="background: #f8f9fa; padding: 30px; text-align: center; color: #666;">
            <p style="margin: 5px 0; font-weight: 600; color: #333;">Terima kasih! 🙏</p>
            <p style="margin: 5px 0; font-size: 13px;">© 2025 Rimuru. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
    """
    
    return EmailService.send_email(client_email, subject, html_content)


def send_client_transfer_request_rejected_email(client_email: str, client_name: str, amount: float, currency: str, from_account: str, to_account: str, reason: str = "") -> bool:
    """Send email to client when balance transfer request is rejected by admin"""
    currency_symbol = "Rp" if currency == "IDR" else "$"
    formatted_amount = f"{currency_symbol} {amount:,.0f}"
    
    subject = f"❌ Transfer Saldo Ditolak - {formatted_amount}"
    
    reason_html = ""
    if reason:
        reason_html = f"""
            <div style="background: #fff3e0; border-left: 4px solid #ff9800; border-radius: 8px; padding: 20px; margin: 25px 0;">
                <p style="margin: 0 0 8px; color: #e65100; font-weight: 600; font-size: 15px;">📝 Alasan Penolakan:</p>
                <p style="margin: 0; color: #666; font-size: 14px; line-height: 1.6;">{reason}</p>
            </div>
        """
    
    html_content = f"""
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f4; font-family: 'Helvetica Neue', Arial, sans-serif;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; text-align: center;">
            <img src="{LOGO_URL}" alt="Rimuru" style="width: 120px; height: auto; display: block; margin: 0 auto;" />
        </div>
        
        <div style="padding: 40px 30px;">
            <div style="text-align: center; margin-bottom: 30px;">
                <div style="background: linear-gradient(135deg, #f44336 0%, #d32f2f 100%); width: 80px; height: 80px; border-radius: 50%; margin: 0 auto; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 15px rgba(244, 67, 54, 0.3);">
                    <span style="font-size: 40px;">❌</span>
                </div>
            </div>
            
            <h1 style="color: #333; font-size: 28px; font-weight: 700; margin: 0 0 20px; text-align: center;">
                Transfer Saldo Ditolak
            </h1>
            
            <p style="color: #666; font-size: 16px; line-height: 1.6; margin: 0 0 25px;">
                Halo <strong style="color: #333;">{client_name}</strong>,
            </p>
            
            <p style="color: #666; font-size: 16px; line-height: 1.6; margin: 0 0 25px;">
                Mohon maaf, permintaan transfer saldo antar akun Anda telah <strong style="color: #f44336;">ditolak</strong> oleh admin.
            </p>
            
            <div style="background: linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%); border-left: 4px solid #f44336; border-radius: 8px; padding: 25px; margin: 25px 0;">
                <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                        <td style="padding: 8px 0; color: #666; font-size: 14px;">
                            <strong style="color: #333;">💰 Jumlah:</strong>
                        </td>
                        <td style="padding: 8px 0; color: #333; font-size: 14px; text-align: right;">
                            <strong>{formatted_amount}</strong>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; color: #666; font-size: 14px;">
                            <strong style="color: #333;">📤 Dari Akun:</strong>
                        </td>
                        <td style="padding: 8px 0; color: #333; font-size: 14px; text-align: right;">
                            <strong>{from_account}</strong>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; color: #666; font-size: 14px;">
                            <strong style="color: #333;">📥 Ke Akun:</strong>
                        </td>
                        <td style="padding: 8px 0; color: #333; font-size: 14px; text-align: right;">
                            <strong>{to_account}</strong>
                        </td>
                    </tr>
                </table>
            </div>
            
            {reason_html}
            
            <div style="text-align: center; margin: 35px 0;">
                <a href="{FRONTEND_URL}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 15px 40px; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);">
                    💬 Hubungi Support
                </a>
            </div>
        </div>
        
        <div style="background: #f8f9fa; padding: 30px; text-align: center; color: #666;">
            <p style="margin: 5px 0; font-weight: 600; color: #333;">Terima kasih! 🙏</p>
            <p style="margin: 5px 0; font-size: 13px;">© 2025 Rimuru. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
    """
    
    return EmailService.send_email(client_email, subject, html_content)


def send_client_account_deleted_email(client_email: str, client_name: str, account_name: str, platform: str, balance_transferred: bool = False, target_account: str = "") -> bool:
    """Send email to client when account is deleted"""
    
    platform_display = {
        "facebook": "Facebook Ads",
        "google": "Google Ads",
        "tiktok": "TikTok Ads"
    }.get(platform.lower(), platform.title())
    
    subject = f"🗑️ Akun {platform_display} Dihapus - {account_name}"
    
    balance_html = ""
    if balance_transferred and target_account:
        balance_html = f"""
            <div style="background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%); border-radius: 12px; padding: 20px; margin: 25px 0; border-left: 4px solid #2196F3;">
                <p style="margin: 0; color: #1565c0; font-size: 15px; line-height: 1.6;">
                    <strong>💰 Saldo Ditransfer</strong><br>
                    <span style="color: #666; font-size: 14px;">Sisa saldo dari akun ini telah ditransfer ke akun <strong>{target_account}</strong></span>
                </p>
            </div>
        """
    
    html_content = f"""
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f4; font-family: 'Helvetica Neue', Arial, sans-serif;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; text-align: center;">
            <img src="{LOGO_URL}" alt="Rimuru" style="width: 120px; height: auto; display: block; margin: 0 auto;" />
        </div>
        
        <div style="padding: 40px 30px;">
            <div style="text-align: center; margin-bottom: 30px;">
                <div style="background: linear-gradient(135deg, #ff9800 0%, #f57c00 100%); width: 80px; height: 80px; border-radius: 50%; margin: 0 auto; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 15px rgba(255, 152, 0, 0.3);">
                    <span style="font-size: 40px;">🗑️</span>
                </div>
            </div>
            
            <h1 style="color: #333; font-size: 28px; font-weight: 700; margin: 0 0 20px; text-align: center;">
                Akun Telah Dihapus
            </h1>
            
            <p style="color: #666; font-size: 16px; line-height: 1.6; margin: 0 0 25px;">
                Halo <strong style="color: #333;">{client_name}</strong>,
            </p>
            
            <p style="color: #666; font-size: 16px; line-height: 1.6; margin: 0 0 25px;">
                Akun <strong style="color: #667eea;">{platform_display}</strong> Anda telah dihapus dari sistem Rimuru.
            </p>
            
            <div style="background: linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%); border-left: 4px solid #ff9800; border-radius: 8px; padding: 25px; margin: 25px 0;">
                <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                        <td style="padding: 8px 0; color: #666; font-size: 14px;">
                            <strong style="color: #333;">📱 Platform:</strong>
                        </td>
                        <td style="padding: 8px 0; color: #333; font-size: 14px; text-align: right;">
                            <strong>{platform_display}</strong>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; color: #666; font-size: 14px;">
                            <strong style="color: #333;">📊 Nama Akun:</strong>
                        </td>
                        <td style="padding: 8px 0; color: #333; font-size: 14px; text-align: right;">
                            <strong>{account_name}</strong>
                        </td>
                    </tr>
                </table>
            </div>
            
            {balance_html}
            
            <div style="background: #f8f9fa; border-radius: 8px; padding: 20px; margin: 25px 0; text-align: center;">
                <p style="margin: 0 0 10px; color: #666; font-size: 14px;">
                    Butuh bantuan atau ingin menambahkan akun baru? 💬
                </p>
                <p style="margin: 0; color: #999; font-size: 13px;">
                    Hubungi kami melalui dashboard Rimuru Anda
                </p>
            </div>
            
            <div style="text-align: center; margin: 35px 0;">
                <a href="{FRONTEND_URL}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 15px 40px; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);">
                    📊 Lihat Dashboard
                </a>
            </div>
        </div>
        
        <div style="background: #f8f9fa; padding: 30px; text-align: center; color: #666;">
            <p style="margin: 5px 0; font-weight: 600; color: #333;">Terima kasih! 🙏</p>
            <p style="margin: 5px 0; font-size: 13px;">© 2025 Rimuru. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
    """
    
    return EmailService.send_email(client_email, subject, html_content)


def send_admin_transfer_request_created_email(admin_emails: list, client_name: str, amount: float, currency: str, from_account: str, to_account: str) -> bool:
    """Send email to admins when client creates a balance transfer request"""
    if not admin_emails:
        return False
    
    currency_symbol = "Rp" if currency == "IDR" else "$"
    formatted_amount = f"{currency_symbol} {amount:,.0f}"
    
    subject = f"🔄 Permintaan Transfer Saldo Baru - {formatted_amount}"
    
    html_content = f"""
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f4; font-family: 'Helvetica Neue', Arial, sans-serif;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; text-align: center;">
            <img src="{LOGO_URL}" alt="Rimuru" style="width: 120px; height: auto; display: block; margin: 0 auto;" />
        </div>
        
        <div style="padding: 40px 30px;">
            <div style="text-align: center; margin-bottom: 30px;">
                <div style="background: linear-gradient(135deg, #2196F3 0%, #1976d2 100%); width: 80px; height: 80px; border-radius: 50%; margin: 0 auto; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 15px rgba(33, 150, 243, 0.3);">
                    <span style="font-size: 40px;">🔄</span>
                </div>
            </div>
            
            <h1 style="color: #333; font-size: 28px; font-weight: 700; margin: 0 0 20px; text-align: center;">
                Permintaan Transfer Saldo Baru
            </h1>
            
            <p style="color: #666; font-size: 16px; line-height: 1.6; margin: 0 0 25px; text-align: center;">
                Ada permintaan transfer saldo antar akun yang perlu diverifikasi
            </p>
            
            <div style="background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%); border-left: 4px solid #2196F3; border-radius: 8px; padding: 25px; margin: 25px 0;">
                <h3 style="color: #1976d2; font-size: 16px; font-weight: 600; margin: 0 0 15px;">📋 Detail Transfer</h3>
                <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                        <td style="padding: 8px 0; color: #666; font-size: 14px;">
                            <strong style="color: #333;">👤 Client:</strong>
                        </td>
                        <td style="padding: 8px 0; color: #333; font-size: 14px; text-align: right;">
                            <strong>{client_name}</strong>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; color: #666; font-size: 14px;">
                            <strong style="color: #333;">💰 Jumlah:</strong>
                        </td>
                        <td style="padding: 8px 0; color: #2196F3; font-size: 18px; text-align: right;">
                            <strong>{formatted_amount}</strong>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; color: #666; font-size: 14px;">
                            <strong style="color: #333;">📤 Dari:</strong>
                        </td>
                        <td style="padding: 8px 0; color: #333; font-size: 14px; text-align: right;">
                            <strong>{from_account}</strong>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; color: #666; font-size: 14px;">
                            <strong style="color: #333;">📥 Ke:</strong>
                        </td>
                        <td style="padding: 8px 0; color: #333; font-size: 14px; text-align: right;">
                            <strong>{to_account}</strong>
                        </td>
                    </tr>
                </table>
            </div>
            
            <div style="background: linear-gradient(135deg, #fff3cd 0%, #fff 100%); border-radius: 12px; padding: 20px; margin: 25px 0; border-left: 4px solid #ffc107;">
                <p style="margin: 0; color: #856404; font-size: 15px; line-height: 1.6;">
                    <strong>⚡ Tindakan Diperlukan</strong><br>
                    <span style="color: #666; font-size: 14px;">Silakan verifikasi dan approve/reject permintaan transfer ini</span>
                </p>
            </div>
            
            <div style="text-align: center; margin: 35px 0;">
                <a href="{FRONTEND_URL}/admin/transfers" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 15px 40px; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);">
                    📋 Proses Transfer
                </a>
            </div>
        </div>
        
        <div style="background: #f8f9fa; padding: 30px; text-align: center; color: #666;">
            <p style="margin: 5px 0; font-weight: 600; color: #333;">Rimuru Admin System 🔧</p>
            <p style="margin: 5px 0; font-size: 13px;">© 2025 Rimuru. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
    """
    
    success_count = 0
    for admin_email in admin_emails:
        if EmailService.send_email(admin_email, subject, html_content):
            success_count += 1
    
    logger.info(f"📧 Transfer request notification sent to {success_count}/{len(admin_emails)} admins")
    return success_count > 0

