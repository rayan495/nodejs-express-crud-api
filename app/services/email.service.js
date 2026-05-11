const nodemailer = require("nodemailer");
const dotenv = require("dotenv");

dotenv.config();

const transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

async function sendTaskNotification(to, action, task) {
    const label = action.charAt(0).toUpperCase() + action.slice(1);
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to,
        subject: `Task ${label}: ${task.title}`,
        html: `
        <h2>Task ${label}</h2>
        <p><strong>Title:</strong> ${task.title}</p>
        <p><strong>Description:</strong> ${task.description}</p>
        <p><strong>Status:</strong> ${task.status}</p>
        `,
    };

    try {
        await transporter.sendMail(mailOptions);
    } catch (err) {
        console.error("Email notification failed:", err.message);
    }
}

module.exports = { sendTaskNotification };