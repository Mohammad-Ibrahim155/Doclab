const express = require('express');
const path = require('path');
const fs = require('fs');
const connectDB = require('./config/db');
const Appointment = require('./models/Appointment');
const { sendAppointmentConfirmation } = require('./config/email');
const Doctor = require('./models/Doctor');

const app = express();
const PORT = process.env.PORT || 3000;

// Connect to database
connectDB();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname));

// Serve static files from the current directory
app.use(express.static(__dirname));

// Route to handle HTML file requests
app.get('/:filename', (req, res) => {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, filename);

    // Check if the file exists and has .html extension
    if (fs.existsSync(filePath) && path.extname(filePath) === '.html') {
        res.sendFile(filePath);
    } else {
        res.status(404).send('File not found');
    }
});

// Route to list all HTML files
app.get('/', (req, res) => {
    fs.readdir(__dirname, (err, files) => {
        if (err) {
            return res.status(500).send('Error reading directory');
        }

        const htmlFiles = files.filter(file => path.extname(file) === '.html');
        const fileList = htmlFiles.map(file => `<li><a href="/${file}">${file}</a></li>`).join('');
        
        res.send(`
            <h1>Available HTML Files</h1>
            <ul>${fileList}</ul>
        `);
    });
});

// Appointment Route
app.post('/api/appointments', async (req, res) => {
    try {
        const appointment = new Appointment({
            patientName: req.body.patientName,
            email: req.body.email,
            phone: req.body.phone,
            date: req.body.date,
            department: req.body.department,
            doctor: req.body.doctor,
            message: req.body.message
        });

        await appointment.save();
        res.status(201).json({ message: 'Appointment scheduled successfully' });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Make appointments route public
app.get('/api/appointments', async (req, res) => {
    try {
        const appointments = await Appointment.find();
        res.json(appointments);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Update appointment status
app.put('/api/appointments/:id/status', async (req, res) => {
    try {
        const appointment = await Appointment.findByIdAndUpdate(
            req.params.id,
            { status: req.body.status },
            { new: true }
        );

        if (!appointment) {
            return res.status(404).json({ message: 'Appointment not found' });
        }

        // Send confirmation email if appointment is accepted
        if (req.body.status === 'accepted') {
            const emailSent = await sendAppointmentConfirmation(appointment);
            if (!emailSent) {
                console.log('Warning: Email notification failed');
            }
        }

        res.json({ 
            appointment,
            message: `Appointment ${req.body.status}${req.body.status === 'accepted' ? ' and confirmation email sent' : ''}`
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Delete appointment
app.delete('/api/appointments/:id', async (req, res) => {
    try {
        const appointment = await Appointment.findByIdAndDelete(req.params.id);
        if (!appointment) {
            return res.status(404).json({ message: 'Appointment not found' });
        }
        res.json({ message: 'Appointment deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Doctor Registration Route
app.post('/api/doctors/register', async (req, res) => {
    try {
        // Check if doctor with email already exists
        const existingDoctor = await Doctor.findOne({ email: req.body.email });
        if (existingDoctor) {
            return res.status(400).json({ message: 'Doctor with this email already exists' });
        }

        // Create new doctor
        const doctor = new Doctor({
            name: req.body.name,
            email: req.body.email,
            password: req.body.qualification, // In a real app, you'd hash this
            department: req.body.phone // Using phone as department for now
        });

        await doctor.save();
        res.status(201).json({ message: 'Doctor registered successfully' });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
