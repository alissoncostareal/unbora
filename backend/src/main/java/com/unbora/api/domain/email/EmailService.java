package com.unbora.api.domain.email;

import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    @Autowired(required = false)
    private JavaMailSender mailSender;

    @Value("${unbora.mail.from:nao-responda@unbora.com.br}")
    private String fromEmail;

    @Value("${unbora.app-url:https://unbora.com.br}")
    private String appUrl;

    @Async
    public void sendPasswordResetEmail(String toEmail, String userName, String resetToken) {
        String resetLink = appUrl + "/reset-password?token=" + resetToken;
        String subject = "Unbora · Redefinição de Senha";

        String htmlContent = """
            <!DOCTYPE html>
            <html lang="pt-BR">
            <head>
              <meta charset="UTF-8">
              <style>
                body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #faf8f5; margin: 0; padding: 40px 20px; color: #1e1b19; }
                .container { max-width: 560px; margin: 0 auto; background: #ffffff; border: 1px solid #eadfd4; border-radius: 20px; overflow: hidden; box-shadow: 0 4px 16px rgba(0,0,0,0.03); }
                .header { background: #faf2ee; padding: 32px; text-align: center; border-bottom: 1px solid #eadfd4; }
                .logo { font-size: 26px; font-weight: 300; letter-spacing: -0.5px; color: #1e1b19; margin: 0; }
                .body { padding: 36px 32px; line-height: 1.6; }
                .title { font-size: 20px; font-weight: 600; margin-top: 0; margin-bottom: 16px; color: #1e1b19; }
                .text { font-size: 14px; color: #55433e; margin-bottom: 24px; }
                .button { display: inline-block; background-color: #1e1b19; color: #ffffff !important; text-decoration: none; padding: 14px 28px; border-radius: 12px; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em; text-align: center; }
                .footer { background: #faf8f5; padding: 20px 32px; text-align: center; font-size: 11px; color: #8a8178; border-top: 1px solid #f0e8e0; }
                .token-box { background: #faf2ee; padding: 12px; border-radius: 8px; font-family: monospace; font-size: 14px; color: #7c2f1d; margin: 16px 0; text-align: center; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1 class="logo">Unbora</h1>
                </div>
                <div class="body">
                  <h2 class="title">Recuperação de Acesso</h2>
                  <p class="text">Olá, <strong>%s</strong>! Recebemos uma solicitação para redefinir a senha da sua conta no Unbora.</p>
                  <p class="text">Clique no botão abaixo para escolher uma nova senha de acesso:</p>
                  <div style="text-align: center; margin: 30px 0;">
                    <a href="%s" class="button">Redefinir Minha Senha</a>
                  </div>
                  <p class="text" style="font-size: 12px; color: #8a8178;">Se o botão não funcionar, copie e cole o link abaixo no seu navegador:<br><span style="word-break: break-all;">%s</span></p>
                  <p class="text" style="font-size: 12px; color: #8a8178;">Este link expira em 1 hora. Se você não solicitou a alteração, ignore este e-mail.</p>
                </div>
                <div class="footer">
                  © %d Unbora. Guia inteligente de experiências urbanas.
                </div>
              </div>
            </body>
            </html>
            """.formatted(userName != null ? userName : "Explorador", resetLink, resetLink, java.time.Year.now().getValue());

        sendEmail(toEmail, subject, htmlContent);
    }

    @Async
    public void sendAccountConfirmationEmail(String toEmail, String userName, String confirmToken) {
        String confirmLink = appUrl + "/confirm-account?token=" + confirmToken;
        String subject = "Bem-vindo ao Unbora · Confirme sua conta";

        String htmlContent = """
            <!DOCTYPE html>
            <html lang="pt-BR">
            <head>
              <meta charset="UTF-8">
              <style>
                body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #faf8f5; margin: 0; padding: 40px 20px; color: #1e1b19; }
                .container { max-width: 560px; margin: 0 auto; background: #ffffff; border: 1px solid #eadfd4; border-radius: 20px; overflow: hidden; box-shadow: 0 4px 16px rgba(0,0,0,0.03); }
                .header { background: #faf2ee; padding: 32px; text-align: center; border-bottom: 1px solid #eadfd4; }
                .logo { font-size: 26px; font-weight: 300; letter-spacing: -0.5px; color: #1e1b19; margin: 0; }
                .body { padding: 36px 32px; line-height: 1.6; }
                .title { font-size: 20px; font-weight: 600; margin-top: 0; margin-bottom: 16px; color: #1e1b19; }
                .text { font-size: 14px; color: #55433e; margin-bottom: 24px; }
                .button { display: inline-block; background-color: #7c2f1d; color: #ffffff !important; text-decoration: none; padding: 14px 28px; border-radius: 12px; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em; text-align: center; }
                .footer { background: #faf8f5; padding: 20px 32px; text-align: center; font-size: 11px; color: #8a8178; border-top: 1px solid #f0e8e0; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1 class="logo">Unbora</h1>
                </div>
                <div class="body">
                  <h2 class="title">Sua jornada urbana começa aqui.</h2>
                  <p class="text">Olá, <strong>%s</strong>! Seja muito bem-vindo ao Unbora. Agora você tem acesso a recomendações personalizadas por IA, lista de favoritos, diário de visitas e benefícios exclusivos de parceiros.</p>
                  <div style="text-align: center; margin: 30px 0;">
                    <a href="%s" class="button">Confirmar Minha Conta</a>
                  </div>
                  <p class="text" style="font-size: 12px; color: #8a8178;">Ou acesse diretamente: <span style="word-break: break-all;">%s</span></p>
                </div>
                <div class="footer">
                  © %d Unbora. Guia inteligente de experiências urbanas.
                </div>
              </div>
            </body>
            </html>
            """.formatted(userName != null ? userName : "Explorador", confirmLink, confirmLink, java.time.Year.now().getValue());

        sendEmail(toEmail, subject, htmlContent);
    }

    private void sendEmail(String toEmail, String subject, String htmlContent) {
        log.info("[EmailService] Enviando e-mail para '{}' com assunto: '{}'", toEmail, subject);

        if (mailSender == null) {
            log.warn("[EmailService] JavaMailSender não configurado. E-mail simulado com sucesso para {}", toEmail);
            return;
        }

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(fromEmail, "Unbora");
            helper.setTo(toEmail);
            helper.setSubject(subject);
            helper.setText(htmlContent, true);

            mailSender.send(message);
            log.info("[EmailService] E-mail enviado com sucesso para '{}'", toEmail);
        } catch (Exception e) {
            log.error("[EmailService] Falha ao enviar e-mail para '{}': {}", toEmail, e.getMessage());
        }
    }
}
