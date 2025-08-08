const nodemailer = require("nodemailer");

// Gmail SMTP 설정
const transporter = nodemailer.createTransport({
	service: "gmail",
	auth: {
		user: process.env.EMAIL_USER, // Gmail 주소
		pass: process.env.EMAIL_PASS, // Gmail 앱 비밀번호
	},
});

// 이메일 인증 메일 발송
const sendVerificationEmail = async (email, token) => {
	const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;

	const mailOptions = {
		from: process.env.EMAIL_USER,
		to: email,
		subject: "SimpleAuthSystem - 이메일 인증",
		html: `
            <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 10px; text-align: center;">
                    <h1 style="color: white; margin: 0;">🎉 회원가입을 축하합니다!</h1>
                </div>
                
                <div style="padding: 30px; background: #f8f9fa; border-radius: 10px; margin-top: 20px;">
                    <h2 style="color: #333;">이메일 인증이 필요합니다</h2>
                    <p style="color: #666; line-height: 1.6;">
                        SimpleAuthSystem에 가입해 주셔서 감사합니다!<br>
                        아래 버튼을 클릭하여 이메일 인증을 완료해주세요.
                    </p>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${verificationUrl}" 
                           style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                                  color: white; 
                                  padding: 15px 30px; 
                                  text-decoration: none; 
                                  border-radius: 8px; 
                                  font-weight: bold;
                                  display: inline-block;">
                            ✅ 이메일 인증하기
                        </a>
                    </div>
                    
                    <p style="color: #999; font-size: 14px; margin-top: 30px;">
                        💡 이 링크는 24시간 후에 만료됩니다.<br>
                        🔒 본인이 가입하지 않았다면 이 이메일을 무시해주세요.
                    </p>
                </div>
            </div>
        `,
	};

	try {
		await transporter.sendMail(mailOptions);
	} catch (error) {
		console.error("이메일 발송 실패:", error);
		throw new Error("이메일 발송에 실패했습니다.");
	}
};

module.exports = {
	sendVerificationEmail,
};
