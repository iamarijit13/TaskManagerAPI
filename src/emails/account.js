const sgMail = require('@sendgrid/mail');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendWelcomeEmail = (email, name, password)=>{
    sgMail.send({
        to: email,
        from: 'secreat12@gmail.com',
        subject: 'You are signed up successfully.',
        text: `Welcome to the service, ${name}. We are glad that you joined. Your Username: ${email} and Password: ${password}.This is a auto generated mail, please do not reply.`
    })
}

const sendSignoffEmail = (email, name) =>{
    sgMail.send({
        to: email,
        from: 'secreat12@gmail.com',
        subject: 'You are successfully sign off.',
        text: `Hello ${name}, \nWe are sad to say you good bye! Hope to see you sometime soon.`
    })
}

module.exports = {sendWelcomeEmail, sendSignoffEmail}
