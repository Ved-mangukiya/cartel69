const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs-extra');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json({ limit: '10mb' })); // Increased limit for base64 data
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));

// Data file path
const dataFilePath = path.join(__dirname, '../data.json');

// Initialize data file if it doesn't exist
if (!fs.existsSync(dataFilePath)) {
    fs.writeJSONSync(dataFilePath, { members: [], pastRecords: {} });
}

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
}

// Get all team members
app.get('/api/members', (req, res) => {
    const data = fs.readJSONSync(dataFilePath);
    res.json(data.members);
});

// Add new team member
app.post('/api/members', (req, res) => {
    try {
        const data = fs.readJSONSync(dataFilePath);
        let photoPath = null;

        // Handle base64 image if provided
        if (req.body.croppedImageData) {
            const base64Data = req.body.croppedImageData.replace(/^data:image\/\w+;base64,/, "");
            const buffer = Buffer.from(base64Data, 'base64');
            const filename = `${Date.now()}.jpg`;
            photoPath = `/uploads/${filename}`;
            fs.writeFileSync(path.join(__dirname, 'uploads', filename), buffer);
        }

        const member = {
            id: Date.now().toString(),
            name: req.body.name,
            description: req.body.description,
            specialty: req.body.specialty,
            weakPoint: req.body.weakPoint,
            photo: photoPath,
            pastRecords: []
        };
        
        data.members.push(member);
        fs.writeJSONSync(dataFilePath, data);
        
        res.json(member);
    } catch (error) {
        console.error('Error saving member:', error);
        res.status(500).json({ error: 'Failed to save member' });
    }
});

// Update team member
app.put('/api/members/:id', (req, res) => {
    try {
        const data = fs.readJSONSync(dataFilePath);
        const id = req.params.id;
        const memberIndex = data.members.findIndex(m => m.id === id);
        
        if (memberIndex === -1) {
            return res.status(404).json({ error: 'Member not found' });
        }
        
        let photoPath = data.members[memberIndex].photo;
        if (req.body.croppedImageData) {
            // Delete old photo if exists
            if (photoPath) {
                const oldPhotoPath = path.join(__dirname, photoPath);
                if (fs.existsSync(oldPhotoPath)) {
                    fs.removeSync(oldPhotoPath);
                }
            }
            // Save new cropped image
            const base64Data = req.body.croppedImageData.replace(/^data:image\/\w+;base64,/, "");
            const buffer = Buffer.from(base64Data, 'base64');
            const filename = `${Date.now()}.jpg`;
            photoPath = `/uploads/${filename}`;
            fs.writeFileSync(path.join(__dirname, 'uploads', filename), buffer);
        }
        
        const updatedMember = {
            ...data.members[memberIndex],
            name: req.body.name || data.members[memberIndex].name,
            description: req.body.description || data.members[memberIndex].description,
            specialty: req.body.specialty || data.members[memberIndex].specialty,
            weakPoint: req.body.weakPoint || data.members[memberIndex].weakPoint,
            photo: photoPath
        };
        
        data.members[memberIndex] = updatedMember;
        fs.writeJSONSync(dataFilePath, data);
        
        res.json(updatedMember);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update member' });
    }
});

// Delete team member
app.delete('/api/members/:id', (req, res) => {
    const data = fs.readJSONSync(dataFilePath);
    const id = req.params.id;
    const memberIndex = data.members.findIndex(m => m.id === id);
    
    if (memberIndex === -1) {
        return res.status(404).json({ error: 'Member not found' });
    }
    
    if (data.members[memberIndex].photo) {
        const photoPath = path.join(__dirname, data.members[memberIndex].photo);
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
    console.log(`Server running on http://0.0.0.0:${PORT}`);
});
