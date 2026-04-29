const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
dotenv.config();

// Import models
const User = require('./models/User');
const Complaint = require('./models/Complaint');
const Issue = require('./models/Issue');

// Realistic Indian names for citizens
const citizenNames = [
  'Rajesh Kumar', 'Priya Sharma', 'Amit Patel', 'Neha Singh', 'Suresh Yadav',
  'Meera Joshi', 'Vikram Malhotra', 'Anjali Nair', 'Rahul Verma', 'Kavita Reddy',
  'Manish Gupta', 'Deepa Iyer', 'Sunil Rao', 'Pooja Mehta', 'Arjun Khanna',
  'Swati Desai', 'Nitin Choudhury', 'Rekha Menon', 'Alok Srivastava', 'Divya Kulkarni'
];

// Wards (1-12)
const wards = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];

// Categories with realistic complaints
const complaintTemplates = {
  Roads: [
    'Large pothole near {location} causing traffic jams daily',
    'Broken road surface on {location} for past 2 months',
    'Missing manhole cover on {location}, dangerous for pedestrians',
    'Speed bumps need repair at {location}',
    'Road widening work incomplete at {location} since 3 months',
    'Multiple potholes on {location} damaging vehicle tires'
  ],
  Sanitation: [
    'Garbage not collected in {location} for 5 days',
    'Open dumping of waste at {location} creating health hazard',
    'Stagnant sewage water at {location} causing diseases',
    'Public toilet in {location} needs immediate cleaning',
    'Drainage blockage at {location} leading to waterlogging'
  ],
  Water: [
    'No water supply in {location} since 3 days',
    'Water leakage from main pipe at {location} wasting water',
    'Dirty/muddy water coming from taps in {location}',
    'Low water pressure in {location} throughout the day',
    'Burst water pipe at {location} flooding the street'
  ],
  Electricity: [
    'Street lights not working on {location} for a week',
    'Frequent power cuts in {location} every evening',
    'Broken electric pole at {location} leaning dangerously',
    'Voltage fluctuation damaging appliances in {location}',
    'Transformer issue causing no electricity in {location}'
  ],
  Other: [
    'Stray animals causing nuisance at {location}',
    'Illegal construction ongoing at {location}',
    'Noise pollution from nearby factory at {location}',
    'Air pollution from burning waste at {location}',
    'Public park in {location} needs maintenance'
  ]
};

// Locations in each ward
const locations = {
  '1': ['MG Road', 'Station Area', 'Civil Lines', 'Gandhi Nagar'],
  '2': ['Patel Nagar', 'Shastri Market', 'Old City', 'Kiran Colony'],
  '3': ['Indira Puram', 'Sector 12', 'Green Park', 'Laxmi Nagar'],
  '4': ['Rajendra Nagar', 'Shivaji Market', 'Vidhan Sabha Road', 'Bank Colony'],
  '5': ['Nehru Place', 'Chandni Chowk', 'Model Town', 'Defense Colony'],
  '6': ['Friends Colony', 'Greater Kailash', 'Saket', 'Hauz Khas'],
  '7': ['Dwarka', 'Janakpuri', 'Uttam Nagar', 'Tilak Nagar'],
  '8': ['Rohini', 'Pitampura', 'Shalimar Bagh', 'Model Town'],
  '9': ['Connaught Place', 'Karol Bagh', 'Rajouri Garden', 'Patel Nagar'],
  '10': ['Lajpat Nagar', 'South Extension', 'Green Park', 'Hauz Khas'],
  '11': ['Vasant Kunj', 'Mehrauli', 'Saket', 'Chattarpur'],
  '12': ['Mayur Vihar', 'Laxmi Nagar', 'Preet Vihar', 'Nirman Vihar']
};

// Generate realistic complaint text
const generateComplaintText = (category, ward) => {
  const templates = complaintTemplates[category];
  const template = templates[Math.floor(Math.random() * templates.length)];
  const locationList = locations[ward] || locations['1'];
  const location = locationList[Math.floor(Math.random() * locationList.length)];
  return template.replace('{location}', location);
};

// Generate realistic title
const generateTitle = (category, ward) => {
  const locationList = locations[ward] || locations['1'];
  const location = locationList[Math.floor(Math.random() * locationList.length)];
  const titles = {
    Roads: [`Pothole issue at ${location}`, `Road damage on ${location}`, `Urgent road repair needed at ${location}`],
    Sanitation: [`Garbage problem at ${location}`, `Sewage issue in ${location}`, `Drainage blockage at ${location}`],
    Water: [`Water shortage in ${location}`, `Pipeline leak at ${location}`, `Water quality issue at ${location}`],
    Electricity: [`Power outage in ${location}`, `Street light failure at ${location}`, `Voltage issue in ${location}`],
    Other: [`Civic issue at ${location}`, `Maintenance required at ${location}`, `Public nuisance at ${location}`]
  };
  const categoryTitles = titles[category];
  return categoryTitles[Math.floor(Math.random() * categoryTitles.length)];
};

// Generate random date within last 30 days
const randomDate = () => {
  const now = new Date();
  const daysAgo = Math.floor(Math.random() * 30);
  return new Date(now.setDate(now.getDate() - daysAgo));
};

// Seed function
async function seedDatabase() {
  try {
    console.log('🌱 Starting database seeding...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/civictrack');
    console.log('✅ Connected to MongoDB');
    
    // Clear existing data
    await User.deleteMany({});
    await Complaint.deleteMany({});
    await Issue.deleteMany({});
    console.log('🗑️ Cleared existing data');
    
    // Create users
    const users = [];
    const adminUser = new User({
      name: 'Admin Authority',
      email: 'admin@civictrack.com',
      password: 'admin123',
      role: 'admin',
      points: 500
    });
    await adminUser.save();
    users.push(adminUser);
    
    // Create 20 citizen users
    for (let i = 0; i < citizenNames.length; i++) {
      const user = new User({
        name: citizenNames[i],
        email: `citizen${i + 1}@example.com`,
        password: 'password123',
        role: 'citizen',
        points: Math.floor(Math.random() * 100) + 10
      });
      await user.save();
      users.push(user);
    }
    console.log(`✅ Created ${users.length} users`);
    
    // Create 100+ complaints
    const complaints = [];
    const categories = ['Roads', 'Sanitation', 'Water', 'Electricity', 'Other'];
    
    for (let i = 0; i < 150; i++) {
      const category = categories[Math.floor(Math.random() * categories.length)];
      const ward = wards[Math.floor(Math.random() * wards.length)];
      const user = users[Math.floor(Math.random() * users.length)];
      const status = Math.random() > 0.6 ? 'resolved' : (Math.random() > 0.5 ? 'pending' : 'in-progress');
      
      const complaint = new Complaint({
        title: generateTitle(category, ward),
        description: generateComplaintText(category, ward),
        category: category,
        location: {
          address: generateComplaintText(category, ward).split(' on ')[1] || locations[ward][0],
          ward: ward,
          lat: 28.6139 + (Math.random() - 0.5) * 0.1,
          lng: 77.2090 + (Math.random() - 0.5) * 0.1
        },
        userId: user._id,
        status: status,
        upvoteCount: Math.floor(Math.random() * 50),
        severity: ['low', 'medium', 'high', 'critical'][Math.floor(Math.random() * 4)],
        createdAt: randomDate()
      });
      
      await complaint.save();
      complaints.push(complaint);
    }
    console.log(`✅ Created ${complaints.length} complaints`);
    
    // Create issues by aggregating complaints
    const issueMap = new Map();
    
    for (const complaint of complaints) {
      const key = `${complaint.category}_${complaint.location.ward}`;
      
      if (!issueMap.has(key)) {
        // Find all similar complaints in this category+ward
        const similarComplaints = complaints.filter(c => 
          c.category === complaint.category && 
          c.location.ward === complaint.location.ward
        );
        
        const complaintIds = similarComplaints.map(c => c._id);
        const complaintCount = similarComplaints.length;
        
        // Determine priority
        let priority = 'Low';
        if (complaintCount > 10) priority = 'High';
        else if (complaintCount >= 5) priority = 'Medium';
        
        // Get department
        const departmentMap = {
          'Roads': 'Public Works',
          'Sanitation': 'Sanitation Department',
          'Water': 'Water Board',
          'Electricity': 'Electricity Board',
          'Other': 'General'
        };
        
        const issue = new Issue({
          issueTitle: `${complaint.category} issues in Ward ${complaint.location.ward}`,
          category: complaint.category,
          ward: complaint.location.ward,
          priority: priority,
          status: similarComplaints.some(c => c.status !== 'resolved') ? 'Pending' : 'Resolved',
          complaintCount: complaintCount,
          initialComplaintCount: complaintCount,
          complaintIds: complaintIds,
          assignedDepartment: departmentMap[complaint.category],
          keywords: [complaint.category, `ward-${complaint.location.ward}`],
          location: complaint.location,
          createdAt: Math.min(...similarComplaints.map(c => c.createdAt)),
          impactMetrics: {
            reduction: 0,
            improvementPercentage: 0,
            peakComplaintCount: complaintCount
          }
        });
        
        await issue.save();
        issueMap.set(key, issue);
        
        // Update complaints with issueId
        for (const c of similarComplaints) {
          c.issueId = issue._id;
          await c.save();
        }
      }
    }
    
    console.log(`✅ Created ${issueMap.size} aggregated issues`);
    
    // Generate impact metrics for issues
    for (const issue of issueMap.values()) {
      const resolvedCount = complaints.filter(c => 
        c.issueId?.toString() === issue._id.toString() && 
        c.status === 'resolved'
      ).length;
      
      const reduction = resolvedCount;
      const improvementPercentage = (reduction / issue.complaintCount) * 100;
      
      issue.impactMetrics = {
        reduction: reduction,
        improvementPercentage: improvementPercentage,
        peakComplaintCount: issue.complaintCount,
        resolutionTime: issue.status === 'Resolved' ? Math.random() * 168 : 0
      };
      
      // Update priority based on current count
      if (issue.complaintCount > 10) issue.priority = 'High';
      else if (issue.complaintCount >= 5) issue.priority = 'Medium';
      else issue.priority = 'Low';
      
      await issue.save();
    }
    
    console.log('🎉 Database seeding complete!');
    console.log(`📊 Summary:
      - Users: ${users.length}
      - Complaints: ${complaints.length}
      - Aggregated Issues: ${issueMap.size}
      - High Priority Issues: ${[...issueMap.values()].filter(i => i.priority === 'High').length}
      - Medium Priority Issues: ${[...issueMap.values()].filter(i => i.priority === 'Medium').length}
      - Low Priority Issues: ${[...issueMap.values()].filter(i => i.priority === 'Low').length}
    `);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding error:', error);
    process.exit(1);
  }
}

seedDatabase();