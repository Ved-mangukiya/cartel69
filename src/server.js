const express = require('express');
const multer = require('multer');
const bodyParser = require('body-parser');
const fs = require('fs-extra');
const path = require('path');

const app = express();
const PORT = 3000;

// Configure storage for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/')
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname))
    }
});

const upload = multer({ storage: storage });

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));

// Data file path
const dataFilePath = path.join(__dirname, '../data.json');

// Initialize data file if it doesn't exist
if (!fs.existsSync(dataFilePath)) {
    fs.writeJSONSync(dataFilePath, { members: [], pastRecords: {} });
}

// Get all team members
app.get('/api/members', (req, res) => {
    const data = fs.readJSONSync(dataFilePath);
    res.json(data.members);
});

// Add new team member
app.post('/api/members', upload.single('photo'), (req, res) => {
    const data = fs.readJSONSync(dataFilePath);
    const member = {
        id: Date.now().toString(),
        name: req.body.name,
        description: req.body.description,
        specialty: req.body.specialty,
        weakPoint: req.body.weakPoint,
        photo: req.file ? `/uploads/${req.file.filename}` : null,
        pastRecords: []
    };
    
    data.members.push(member);
    fs.writeJSONSync(dataFilePath, data);
    
    res.json(member);
});

// Update team member
app.put('/api/members/:id', upload.single('photo'), (req, res) => {
    const data = fs.readJSONSync(dataFilePath);
    const id = req.params.id;
    const memberIndex = data.members.findIndex(m => m.id === id);
    
    if (memberIndex === -1) {
        return res.status(404).json({ error: 'Member not found' });
    }
    
    const updatedMember = {
        ...data.members[memberIndex],
        name: req.body.name || data.members[memberIndex].name,
        description: req.body.description || data.members[memberIndex].description,
        specialty: req.body.specialty || data.members[memberIndex].specialty,
        weakPoint: req.body.weakPoint || data.members[memberIndex].weakPoint,
    };
    
    if (req.file) {
        // If there's an existing photo, delete it
        if (data.members[memberIndex].photo) {
            const oldPhotoPath = path.join(__dirname, '..', data.members[memberIndex].photo);
            if (fs.existsSync(oldPhotoPath)) {
                fs.removeSync(oldPhotoPath);
            }
        }
        updatedMember.photo = `/uploads/${req.file.filename}`;
    }
    
    data.members[memberIndex] = updatedMember;
    fs.writeJSONSync(dataFilePath, data);
    
    res.json(updatedMember);
});

// Delete team member
app.delete('/api/members/:id', (req, res) => {
    const data = fs.readJSONSync(dataFilePath);
    const id = req.params.id;
    const memberIndex = data.members.findIndex(m => m.id === id);
    
    if (memberIndex === -1) {
        return res.status(404).json({ error: 'Member not found' });
    }
    
    // Delete photo if exists
    if (data.members[memberIndex].photo) {
        const photoPath = path.join(__dirname, '..', data.members[memberIndex].photo);
        if (fs.existsSync(photoPath)) {
            fs.removeSync(photoPath);
        }
    }
    
    data.members.splice(memberIndex, 1);
    fs.writeJSONSync(dataFilePath, data);
    
    res.json({ success: true });
});

// Add past record to team member
app.post('/api/members/:id/records', (req, res) => {
    const data = fs.readJSONSync(dataFilePath);
    const id = req.params.id;
    const memberIndex = data.members.findIndex(m => m.id === id);
    
    if (memberIndex === -1) {
        return res.status(404).json({ error: 'Member not found' });
    }
    
    const record = {
        id: Date.now().toString(),
        title: req.body.title,
        description: req.body.description,
        date: req.body.date || new Date().toISOString()
    };
    
    if (!data.members[memberIndex].pastRecords) {
        data.members[memberIndex].pastRecords = [];
    }
    
    data.members[memberIndex].pastRecords.push(record);
    fs.writeJSONSync(dataFilePath, data);
    
    res.json(record);
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
});