const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'abhisheksingrajput08@gmail.com', // Replace with your email
        pass: 'dzsp teui wzgd dcwr' // Replace with your app password
    }
});

const sendAppointmentConfirmation = async (appointment) => {
    const mailOptions = {
        from: 'mrsachinchaurasiya@gmail.com',
        to: appointment.email,
        subject: 'Appointment Confirmation - Doclab',
        html: `
            <h1>Appointment Confirmed</h1>
            <p>Dear ${appointment.patientName},</p>
            <p>Your appointment has been confirmed with the following details:</p>
            <ul>
                <li>Date: ${new Date(appointment.date).toLocaleString()}</li>
                <li>Department: ${appointment.department}</li>
                <li>Doctor: ${appointment.doctor}</li>
            </ul>
            <p>Please arrive 15 minutes before your scheduled time.</p>
            <p>If you need to reschedule, please contact us at least 24 hours in advance.</p>
            <br>
            <p>Best regards,</p>
            <p>Doclab Team</p>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log('Confirmation email sent');
        return true;
    } catch (error) {
        console.error('Error sending email:', error);
        return false;
    }
};

module.exports = { sendAppointmentConfirmation };
