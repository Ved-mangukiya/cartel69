// Global variables
let members = [];
const isAdminPage = window.location.pathname.includes('admin.html');

// DOM Elements
const memberForm = document.getElementById('member-form');
const recordForm = document.getElementById('record-form');
const cancelEditButton = document.getElementById('cancel-edit');
const cancelRecordButton = document.getElementById('cancel-record');
const formTitle = document.getElementById('form-title');
const photoInput = document.getElementById('photo');
const photoPreview = document.getElementById('photo-preview');
const recordsModal = document.getElementById('records-modal');

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    fetchMembers();
    
    if (memberForm) {
        memberForm.addEventListener('submit', handleMemberSubmit);
    }
    
    if (recordForm) {
        recordForm.addEventListener('submit', handleRecordSubmit);
    }
    
    if (cancelEditButton) {
        cancelEditButton.addEventListener('click', resetMemberForm);
    }
    
    if (cancelRecordButton) {
        cancelRecordButton.addEventListener('click', () => {
            document.querySelector('.record-form-section').style.display = 'none';
            document.querySelector('.member-form-section').style.display = 'block';
        });
    }
    
    if (photoInput) {
        photoInput.addEventListener('change', handlePhotoPreview);
    }
    
    // Close modal when clicking on X or outside
    document.querySelectorAll('.close-button').forEach(button => {
        button.addEventListener('click', () => {
            document.querySelectorAll('.modal').forEach(modal => {
                modal.style.display = 'none';
            });
        });
    });
    
    window.addEventListener('click', (e) => {
        document.querySelectorAll('.modal').forEach(modal => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
    });
});

// Fetch all team members
async function fetchMembers() {
    try {
        const response = await fetch('/api/members');
        members = await response.json();
        
        if (isAdminPage) {
            renderAdminMembers();
        } else {
            renderTeamMembers();
        }
    } catch (error) {
        console.error('Error fetching members:', error);
        const container = isAdminPage ? document.getElementById('admin-members') : document.getElementById('team-members');
        container.innerHTML = '<p class="error">Failed to load team members. Please try again later.</p>';
    }
}

// Render team members on the main page
function renderTeamMembers() {
    const container = document.getElementById('team-members');
    
    if (members.length === 0) {
        container.innerHTML = '<p class="no-members">No team members found.</p>';
        return;
    }
    
    const html = members.map(member => `
        <div class="member-card">
            <img src="${member.photo || '/img/default-profile.png'}" alt="${member.name}" class="member-photo" onerror="this.src='/img/default-profile.png'">
            <div class="member-info">
                <h3 class="member-name">${member.name}</h3>
                <p class="member-description">${member.description}</p>
                <div class="member-stats">
                    <span class="member-specialty">Specialty: ${member.specialty}</span>
                    <span class="member-weakness">Weakness: ${member.weakPoint}</span>
                </div>
            </div>
            <button class="view-records" data-id="${member.id}">View Past Records</button>
        </div>
    `).join('');
    
    container.innerHTML = html;
    
    // Add event listeners to view records buttons
    document.querySelectorAll('.view-records').forEach(button => {
        button.addEventListener('click', () => {
            const memberId = button.getAttribute('data-id');
            const member = members.find(m => m.id === memberId);
            showRecordsModal(member);
        });
    });
}

// Render team members on the admin page
function renderAdminMembers() {
    const container = document.getElementById('admin-members');
    
    if (members.length === 0) {
        container.innerHTML = '<p class="no-members">No team members found.</p>';
        return;
    }
    
    const html = members.map(member => `
        <div class="admin-member-item">
            <div class="admin-member-info">
                <img src="${member.photo || '/img/default-profile.png'}" alt="${member.name}" class="admin-member-thumbnail" onerror="this.src='/img/default-profile.png'">
                <div>
                    <h3>${member.name}</h3>
                    <p>${member.specialty}</p>
                </div>
            </div>
            <div class="admin-member-actions">
                <button class="btn info add-record" data-id="${member.id}">Add Record</button>
                <button class="btn primary edit-member" data-id="${member.id}">Edit</button>
                <button class="btn danger delete-member" data-id="${member.id}">Delete</button>
            </div>
        </div>
    `).join('');
    
    container.innerHTML = html;
    
    // Add event listeners to admin buttons
    document.querySelectorAll('.edit-member').forEach(button => {
        button.addEventListener('click', () => {
            const memberId = button.getAttribute('data-id');
            editMember(memberId);
        });
    });
    
    document.querySelectorAll('.delete-member').forEach(button => {
        button.addEventListener('click', () => {
            const memberId = button.getAttribute('data-id');
            deleteMember(memberId);
        });
    });
    
    document.querySelectorAll('.add-record').forEach(button => {
        button.addEventListener('click', () => {
            const memberId = button.getAttribute('data-id');
            showRecordForm(memberId);
        });
    });
}

// Handle member form submission (add/edit)
async function handleMemberSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(memberForm);
    const memberId = document.getElementById('member-id').value;
    
    try {
        let response;
        
        if (memberId) {
            // Update existing member
            response = await fetch(`/api/members/${memberId}`, {
                method: 'PUT',
                body: formData
            });
        } else {
            // Add new member
            response = await fetch('/api/members', {
                method: 'POST',
                body: formData
            });
        }
        
        if (!response.ok) {
            throw new Error('Failed to save member');
        }
        
        resetMemberForm();
        fetchMembers();
    } catch (error) {
        console.error('Error saving member:', error);
        alert('Failed to save team member. Please try again.');
    }
}

// Handle record form submission
async function handleRecordSubmit(e) {
    e.preventDefault();
    
    const memberId = document.getElementById('record-member-id').value;
    const recordTitle = document.getElementById('record-title').value;
    const recordDescription = document.getElementById('record-description').value;
    const recordDate = document.getElementById('record-date').value;
    
    try {
        const response = await fetch(`/api/members/${memberId}/records`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                title: recordTitle,
                description: recordDescription,
                date: recordDate
            })
        });
        
        if (!response.ok) {
            throw new Error('Failed to add record');
        }
        
        document.querySelector('.record-form-section').style.display = 'none';
        document.querySelector('.member-form-section').style.display = 'block';
        recordForm.reset();
        fetchMembers();
    } catch (error) {
        console.error('Error adding record:', error);
        alert('Failed to add record. Please try again.');
    }
}

// Show form to add past record
function showRecordForm(memberId) {
    document.getElementById('record-member-id').value = memberId;
    document.querySelector('.member-form-section').style.display = 'none';
    document.querySelector('.record-form-section').style.display = 'block';
    recordForm.reset();
}

// Edit member
function editMember(memberId) {
    const member = members.find(m => m.id === memberId);
    
    if (!member) return;
    
    document.getElementById('member-id').value = member.id;
    document.getElementById('name').value = member.name;
    document.getElementById('description').value = member.description;
    document.getElementById('specialty').value = member.specialty;
    document.getElementById('weakPoint').value = member.weakPoint;
    
    if (member.photo) {
        photoPreview.innerHTML = `<img src="${member.photo}" alt="${member.name}">`;
    } else {
        photoPreview.innerHTML = '';
    }
    
    formTitle.textContent = 'Edit Team Member';
    cancelEditButton.style.display = 'block';
    
    // Scroll to the form
    memberForm.scrollIntoView({ behavior: 'smooth' });
}

// Delete member
async function deleteMember(memberId) {
    if (!confirm('Are you sure you want to delete this team member?')) {
        return;
    }
    
    try {
        const response = await fetch(`/api/members/${memberId}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            throw new Error('Failed to delete member');
        }
        
        fetchMembers();
    } catch (error) {
        console.error('Error deleting member:', error);
        alert('Failed to delete team member. Please try again.');
    }
}

// Show records modal
function showRecordsModal(member) {
    const modalTitle = document.getElementById('modal-title');
    const recordsContainer = document.getElementById('records-container');
    
    modalTitle.textContent = `${member.name}'s Past Records`;
    
    if (!member.pastRecords || member.pastRecords.length === 0) {
        recordsContainer.innerHTML = '<p>No past records found for this team member.</p>';
    } else {
        const html = member.pastRecords.map(record => `
            <div class="record-item">
                <div class="record-date">${new Date(record.date).toLocaleDateString()}</div>
                <h3 class="record-title">${record.title}</h3>
                <p>${record.description}</p>
            </div>
        `).join('');
        
        recordsContainer.innerHTML = html;
    }
    
    recordsModal.style.display = 'block';
}

// Handle photo preview
function handlePhotoPreview(e) {
    const file = e.target.files[0];
    
    if (file) {
        const reader = new FileReader();
        
        reader.onload = function(e) {
            photoPreview.innerHTML = `<img src="${e.target.result}" alt="Preview">`;
        };
        
        reader.readAsDataURL(file);
    } else {
        photoPreview.innerHTML = '';
    }
}

// Reset member form
function resetMemberForm() {
    memberForm.reset();
    document.getElementById('member-id').value = '';
    photoPreview.innerHTML = '';
    formTitle.textContent = 'Add New Team Member';
    cancelEditButton.style.display = 'none';
}