// Backend API for Mohandz Engineering Services Platform
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, 'uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});

const upload = multer({ 
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|xls|xlsx|zip/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        
        if (extname && mimetype) {
            return cb(null, true);
        } else {
            cb(new Error('نوع الملف غير مدعوم'));
        }
    }
});

// MongoDB connection
mongoose.connect('mongodb://localhost:27017/mohandz', {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('تم الاتصال بقاعدة البيانات بنجاح'))
.catch(err => console.error('خطأ في الاتصال بقاعدة البيانات:', err));

// Define schemas and models
const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phone: { type: String },
    address: { type: String },
    role: { type: String, enum: ['client', 'engineer', 'admin'], default: 'client' },
    createdAt: { type: Date, default: Date.now },
    lastLogin: { type: Date }
});

const departmentSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String },
    image: { type: String },
    displayOrder: { type: Number, default: 0 }
});

const serviceSchema = new mongoose.Schema({
    department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: true },
    name: { type: String, required: true },
    description: { type: String },
    image: { type: String },
    basePrice: { type: Number },
    requirements: [{ type: String }],
    requiredDocuments: [{ type: String }],
    estimatedTime: { type: String },
    displayOrder: { type: Number, default: 0 }
});

const orderSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    service: { type: mongoose.Schema.Types.ObjectId, ref: 'Service', required: true },
    engineer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    details: { type: String },
    attachments: [{ type: String }],
    status: { 
        type: String, 
        enum: ['pending', 'in_review', 'in_progress', 'completed', 'cancelled'], 
        default: 'pending' 
    },
    totalCost: { type: Number },
    createdAt: { type: Date, default: Date.now },
    expectedDeliveryDate: { type: Date },
    actualDeliveryDate: { type: Date }
});

const paymentSchema = new mongoose.Schema({
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true },
    paymentMethod: { type: String },
    status: { 
        type: String, 
        enum: ['pending', 'completed', 'failed'], 
        default: 'pending' 
    },
    transactionId: { type: String },
    createdAt: { type: Date, default: Date.now }
});

const messageSchema = new mongoose.Schema({
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
    content: { type: String, required: true },
    attachments: [{ type: String }],
    isRead: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
});

const notificationSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String },
    content: { type: String, required: true },
    link: { type: String },
    isRead: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
});

const projectSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String },
    category: { type: String },
    images: [{ type: String }],
    completionDate: { type: Date }
});

// Create models
const User = mongoose.model('User', userSchema);
const Department = mongoose.model('Department', departmentSchema);
const Service = mongoose.model('Service', serviceSchema);
const Order = mongoose.model('Order', orderSchema);
const Payment = mongoose.model('Payment', paymentSchema);
const Message = mongoose.model('Message', messageSchema);
const Notification = mongoose.model('Notification', notificationSchema);
const Project = mongoose.model('Project', projectSchema);

// Authentication middleware
const auth = async (req, res, next) => {
    try {
        const token = req.header('Authorization').replace('Bearer ', '');
        const decoded = jwt.verify(token, 'mohandzsecretkey');
        const user = await User.findById(decoded.id);
        
        if (!user) {
            throw new Error();
        }
        
        req.token = token;
        req.user = user;
        next();
    } catch (error) {
        res.status(401).send({ error: 'الرجاء تسجيل الدخول' });
    }
};

// Admin middleware
const adminOnly = async (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).send({ error: 'غير مصرح لك بالوصول' });
    }
    next();
};

// Engineer middleware
const engineerOrAdmin = async (req, res, next) => {
    if (req.user.role !== 'engineer' && req.user.role !== 'admin') {
        return res.status(403).send({ error: 'غير مصرح لك بالوصول' });
    }
    next();
};

// Routes

// Auth routes
app.post('/api/auth/register', async (req, res) => {
    try {
        const { name, email, password, phone, address } = req.body;
        
        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).send({ error: 'البريد الإلكتروني مستخدم بالفعل' });
        }
        
        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        
        // Create new user
        const user = new User({
            name,
            email,
            password: hashedPassword,
            phone,
            address
        });
        
        await user.save();
        
        // Generate JWT token
        const token = jwt.sign({ id: user._id }, 'mohandzsecretkey', { expiresIn: '1d' });
        
        res.status(201).send({ user, token });
    } catch (error) {
        res.status(400).send({ error: error.message });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // Find user
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).send({ error: 'بيانات الدخول غير صحيحة' });
        }
        
        // Verify password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).send({ error: 'بيانات الدخول غير صحيحة' });
        }
        
        // Update last login
        user.lastLogin = new Date();
        await user.save();
        
        // Generate JWT token
        const token = jwt.sign({ id: user._id }, 'mohandzsecretkey', { expiresIn: '1d' });
        
        res.send({ user, token });
    } catch (error) {
        res.status(400).send({ error: error.message });
    }
});

app.post('/api/auth/logout', auth, (req, res) => {
    res.send({ message: 'تم تسجيل الخروج بنجاح' });
});

app.post('/api/auth/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;
        
        // Find user
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).send({ error: 'المستخدم غير موجود' });
        }
        
        // In a real application, you would send an email with a reset link
        // For this demo, we'll just return a success message
        
        res.send({ message: 'تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني' });
    } catch (error) {
        res.status(400).send({ error: error.message });
    }
});

app.post('/api/auth/reset-password', async (req, res) => {
    try {
        const { token, password } = req.body;
        
        // In a real application, you would verify the token and find the user
        // For this demo, we'll just return a success message
        
        res.send({ message: 'تم إعادة تعيين كلمة المرور بنجاح' });
    } catch (error) {
        res.status(400).send({ error: error.message });
    }
});

// User routes
app.get('/api/users/profile', auth, async (req, res) => {
    res.send(req.user);
});

app.put('/api/users/profile', auth, async (req, res) => {
    try {
        const updates = Object.keys(req.body);
        const allowedUpdates = ['name', 'phone', 'address'];
        const isValidOperation = updates.every(update => allowedUpdates.includes(update));
        
        if (!isValidOperation) {
            return res.status(400).send({ error: 'تحديثات غير صالحة' });
        }
        
        updates.forEach(update => req.user[update] = req.body[update]);
        await req.user.save();
        
        res.send(req.user);
    } catch (error) {
        res.status(400).send({ error: error.message });
    }
});

app.get('/api/users', auth, adminOnly, async (req, res) => {
    try {
        const users = await User.find({});
        res.send(users);
    } catch (error) {
        res.status(500).send({ error: error.message });
    }
});

app.get('/api/users/:id', auth, adminOnly, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).send({ error: 'المستخدم غير موجود' });
        }
        res.send(user);
    } catch (error) {
        res.status(500).send({ error: error.message });
    }
});

app.put('/api/users/:id', auth, adminOnly, async (req, res) => {
    try {
        const updates = Object.keys(req.body);
        const allowedUpdates = ['name', 'email', 'phone', 'address', 'role'];
        const isValidOperation = updates.every(update => allowedUpdates.includes(update));
        
        if (!isValidOperation) {
            return res.status(400).send({ error: 'تحديثات غير صالحة' });
        }
        
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).send({ error: 'المستخدم غير موجود' });
        }
        
        updates.forEach(update => user[update] = req.body[update]);
        await user.save();
        
        res.send(user);
    } catch (error) {
        res.status(400).send({ error: error.message });
    }
});

app.delete('/api/users/:id', auth, adminOnly, async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);
        if (!user) {
            return res.status(404).send({ error: 'المستخدم غير موجود' });
        }
        res.send(user);
    } catch (error) {
        res.status(500).send({ error: error.message });
    }
});

// Department routes
app.get('/api/departments', async (req, res) => {
    try {
        const departments = await Department.find({}).sort({ displayOrder: 1 });
        res.send(departments);
    } catch (error) {
        res.status(500).send({ error: error.message });
    }
});

app.get('/api/departments/:id', async (req, res) => {
    try {
        const department = await Department.findById(req.params.id);
        if (!department) {
            return res.status(404).send({ error: 'القسم غير موجود' });
        }
        res.send(department);
    } catch (error) {
        res.status(500).send({ error: error.message });
    }
});

app.post('/api/departments', auth, adminOnly, upload.single('image'), async (req, res) => {
    try {
        const { name, description, displayOrder } = req.body;
        
        const department = new Department({
            name,
            description,
            displayOrder,
            image: req.file ? `/uploads/${req.file.filename}` : null
        });
        
        await department.save();
        res.status(201).send(department);
    } catch (error) {
        res.status(400).send({ error: error.message });
    }
});

app.put('/api/departments/:id', auth, adminOnly, upload.single('image'), async (req, res) => {
    try {
        const updates = Object.keys(req.body);
        const allowedUpdates = ['name', 'description', 'displayOrder'];
        const isValidOperation = updates.every(update => allowedUpdates.includes(update));
        
        if (!isValidOperation) {
            return res.status(400).send({ error: 'تحديثات غير صالحة' });
        }
        
        const department = await Department.findById(req.params.id);
        if (!department) {
            return res.status(404).send({ error: 'القسم غير موجود' });
        }
        
        updates.forEach(update => department[update] = req.body[update]);
        
        if (req.file) {
            department.image = `/uploads/${req.file.filename}`;
        }
        
        await department.save();
        res.send(department);
    } catch (error) {
        res.status(400).send({ error: error.message });
    }
});

app.delete('/api/departments/:id', auth, adminOnly, async (req, res) => {
    try {
        const department = await Department.findByIdAndDelete(req.params.id);
        if (!department) {
            return res.status(404).send({ error: 'القسم غير موجود' });
        }
        res.send(department);
    } catch (error) {
        res.status(500).send({ error: error.message });
    }
});

// Service routes
app.get('/api/services', async (req, res) => {
    try {
        const services = await Service.find({})
            .populate('department')
            .sort({ displayOrder: 1 });
        res.send(services);
    } catch (error) {
        res.status(500).send({ error: error.message });
    }
});

app.get('/api/services/:id', async (req, res) => {
    try {
        const service = await Service.findById(req.params.id).populate('department');
        if (!service) {
            return res.status(404).send({ error: 'الخدمة غير موجودة' });
        }
        res.send(service);
    } catch (error) {
        res.status(500).send({ error: error.message });
    }
});

app.post('/api/services', auth, adminOnly, upload.single('image'), async (req, res) => {
    try {
        const { 
            department, 
            name, 
            description, 
            basePrice, 
            requirements, 
            requiredDocuments, 
            estimatedTime, 
            displayOrder 
        } = req.body;
        
        const service = new Service({
            department,
            name,
            description,
            basePrice,
            requirements: requirements ? requirements.split(',') : [],
            requiredDocuments: requiredDocuments ? requiredDocuments.split(',') : [],
            estimatedTime,
            displayOrder,
            image: req.file ? `/uploads/${req.file.filename}` : null
        });
        
        await service.save();
        res.status(201).send(service);
    } catch (error) {
        res.status(400).send({ error: error.message });
    }
});

app.put('/api/services/:id', auth, adminOnly, upload.single('image'), async (req, res) => {
    try {
        const updates = Object.keys(req.body);
        const allowedUpdates = [
            'department', 
            'name', 
            'description', 
            'basePrice', 
            'requirements', 
            'requiredDocuments', 
            'estimatedTime', 
            'displayOrder'
        ];
        const isValidOperation = updates.every(update => allowedUpdates.includes(update));
        
        if (!isValidOperation) {
            return res.status(400).send({ error: 'تحديثات غير صالحة' });
        }
        
        const service = await Service.findById(req.params.id);
        if (!service) {
            return res.status(404).send({ error: 'الخدمة غير موجودة' });
        }
        
        updates.forEach(update => {
            if (update === 'requirements' || update === 'requiredDocuments') {
                service[update] = req.body[update] ? req.body[update].split(',') : [];
            } else {
                service[update] = req.body[update];
            }
        });
        
        if (req.file) {
            service.image = `/uploads/${req.file.filename}`;
        }
        
        await service.save();
        res.send(service);
    } catch (error) {
        res.status(400).send({ error: error.message });
    }
});

app.delete('/api/services/:id', auth, adminOnly, async (req, res) => {
    try {
        const service = await Service.findByIdAndDelete(req.params.id);
        if (!service) {
            return res.status(404).send({ error: 'الخدمة غير موجودة' });
        }
        res.send(service);
    } catch (error) {
        res.status(500).send({ error: error.message });
    }
});

// Order routes
app.get('/api/orders', auth, async (req, res) => {
    try {
        let orders;
        
        if (req.user.role === 'admin') {
            orders = await Order.find({})
                .populate('user')
                .populate('service')
                .populate('engineer')
                .sort({ createdAt: -1 });
        } else if (req.user.role === 'engineer') {
            orders = await Order.find({ engineer: req.user._id })
                .populate('user')
                .populate('service')
                .sort({ createdAt: -1 });
        } else {
            orders = await Order.find({ user: req.user._id })
                .populate('service')
                .populate('engineer')
                .sort({ createdAt: -1 });
        }
        
        res.send(orders);
    } catch (error) {
        res.status(500).send({ error: error.message });
    }
});

app.get('/api/orders/:id', auth, async (req, res) => {
    try {
        const order = await Order.findById(req.params.id)
            .populate('user')
            .populate('service')
            .populate('engineer');
        
        if (!order) {
            return res.status(404).send({ error: 'الطلب غير موجود' });
        }
        
        // Check if user has permission to view this order
        if (req.user.role !== 'admin' && 
            req.user._id.toString() !== order.user._id.toString() && 
            (!order.engineer || req.user._id.toString() !== order.engineer._id.toString())) {
            return res.status(403).send({ error: 'غير مصرح لك بالوصول' });
        }
        
        res.send(order);
    } catch (error) {
        res.status(500).send({ error: error.message });
    }
});

app.post('/api/orders', auth, upload.array('attachments', 5), async (req, res) => {
    try {
        const { service, details, expectedDeliveryDate } = req.body;
        
        const serviceObj = await Service.findById(service);
        if (!serviceObj) {
            return res.status(404).send({ error: 'الخدمة غير موجودة' });
        }
        
        const attachments = req.files ? req.files.map(file => `/uploads/${file.filename}`) : [];
        
        const order = new Order({
            user: req.user._id,
            service,
            details,
            attachments,
            totalCost: serviceObj.basePrice,
            expectedDeliveryDate: expectedDeliveryDate || null
        });
        
        await order.save();
        
        // Create notification for admin
        const notification = new Notification({
            user: req.user._id,
            type: 'new_order',
            content: `تم إنشاء طلب جديد بواسطة ${req.user.name}`,
            link: `/admin/orders/${order._id}`
        });
        
        await notification.save();
        
        res.status(201).send(order);
    } catch (error) {
        res.status(400).send({ error: error.message });
    }
});

app.put('/api/orders/:id', auth, async (req, res) => {
    try {
        const updates = Object.keys(req.body);
        const allowedUpdates = ['details', 'expectedDeliveryDate'];
        const isValidOperation = updates.every(update => allowedUpdates.includes(update));
        
        if (!isValidOperation) {
            return res.status(400).send({ error: 'تحديثات غير صالحة' });
        }
        
        const order = await Order.findById(req.params.id);
        if (!order) {
            return res.status(404).send({ error: 'الطلب غير موجود' });
        }
        
        // Check if user has permission to update this order
        if (req.user.role !== 'admin' && req.user._id.toString() !== order.user.toString()) {
            return res.status(403).send({ error: 'غير مصرح لك بالوصول' });
        }
        
        // Only allow updates if order is not completed or cancelled
        if (order.status === 'completed' || order.status === 'cancelled') {
            return res.status(400).send({ error: 'لا يمكن تحديث طلب مكتمل أو ملغي' });
        }
        
        updates.forEach(update => order[update] = req.body[update]);
        await order.save();
        
        res.send(order);
    } catch (error) {
        res.status(400).send({ error: error.message });
    }
});

app.delete('/api/orders/:id', auth, async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) {
            return res.status(404).send({ error: 'الطلب غير موجود' });
        }
        
        // Check if user has permission to delete this order
        if (req.user.role !== 'admin' && req.user._id.toString() !== order.user.toString()) {
            return res.status(403).send({ error: 'غير مصرح لك بالوصول' });
        }
        
        // Only allow deletion if order is pending
        if (order.status !== 'pending') {
            return res.status(400).send({ error: 'لا يمكن حذف طلب قيد التنفيذ أو مكتمل' });
        }
        
        await order.remove();
        res.send(order);
    } catch (error) {
        res.status(500).send({ error: error.message });
    }
});

app.put('/api/orders/:id/status', auth, engineerOrAdmin, async (req, res) => {
    try {
        const { status, engineer } = req.body;
        
        if (!['pending', 'in_review', 'in_progress', 'completed', 'cancelled'].includes(status)) {
            return res.status(400).send({ error: 'حالة غير صالحة' });
        }
        
        const order = await Order.findById(req.params.id);
        if (!order) {
            return res.status(404).send({ error: 'الطلب غير موجود' });
        }
        
        order.status = status;
        
        if (engineer && req.user.role === 'admin') {
            order.engineer = engineer;
        }
        
        if (status === 'completed') {
            order.actualDeliveryDate = new Date();
        }
        
        await order.save();
        
        // Create notification for user
        const notification = new Notification({
            user: order.user,
            type: 'order_status',
            content: `تم تحديث حالة طلبك إلى ${status}`,
            link: `/orders/${order._id}`
        });
        
        await notification.save();
        
        res.send(order);
    } catch (error) {
        res.status(400).send({ error: error.message });
    }
});

app.post('/api/orders/:id/files', auth, upload.array('files', 5), async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) {
            return res.status(404).send({ error: 'الطلب غير موجود' });
        }
        
        // Check if user has permission to add files to this order
        if (req.user.role !== 'admin' && 
            req.user._id.toString() !== order.user.toString() && 
            (!order.engineer || req.user._id.toString() !== order.engineer.toString())) {
            return res.status(403).send({ error: 'غير مصرح لك بالوصول' });
        }
        
        const files = req.files.map(file => `/uploads/${file.filename}`);
        order.attachments = [...order.attachments, ...files];
        
        await order.save();
        
        res.send(order);
    } catch (error) {
        res.status(400).send({ error: error.message });
    }
});

app.get('/api/orders/:id/files', auth, async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) {
            return res.status(404).send({ error: 'الطلب غير موجود' });
        }
        
        // Check if user has permission to view files of this order
        if (req.user.role !== 'admin' && 
            req.user._id.toString() !== order.user.toString() && 
            (!order.engineer || req.user._id.toString() !== order.engineer.toString())) {
            return res.status(403).send({ error: 'غير مصرح لك بالوصول' });
        }
        
        res.send(order.attachments);
    } catch (error) {
        res.status(500).send({ error: error.message });
    }
});

// Payment routes
app.get('/api/payments', auth, async (req, res) => {
    try {
        let payments;
        
        if (req.user.role === 'admin') {
            payments = await Payment.find({})
                .populate('user')
                .populate('order')
                .sort({ createdAt: -1 });
        } else {
            payments = await Payment.find({ user: req.user._id })
                .populate('order')
                .sort({ createdAt: -1 });
        }
        
        res.send(payments);
    } catch (error) {
        res.status(500).send({ error: error.message });
    }
});

app.get('/api/payments/:id', auth, async (req, res) => {
    try {
        const payment = await Payment.findById(req.params.id)
            .populate('user')
            .populate('order');
        
        if (!payment) {
            return res.status(404).send({ error: 'المدفوعات غير موجودة' });
        }
        
        // Check if user has permission to view this payment
        if (req.user.role !== 'admin' && req.user._id.toString() !== payment.user._id.toString()) {
            return res.status(403).send({ error: 'غير مصرح لك بالوصول' });
        }
        
        res.send(payment);
    } catch (error) {
        res.status(500).send({ error: error.message });
    }
});

app.post('/api/payments', auth, async (req, res) => {
    try {
        const { order, amount, paymentMethod } = req.body;
        
        const orderObj = await Order.findById(order);
        if (!orderObj) {
            return res.status(404).send({ error: 'الطلب غير موجود' });
        }
        
        // Check if user has permission to make payment for this order
        if (req.user._id.toString() !== orderObj.user.toString() && req.user.role !== 'admin') {
            return res.status(403).send({ error: 'غير مصرح لك بالوصول' });
        }
        
        // In a real application, you would integrate with a payment gateway here
        // For this demo, we'll just create a payment record
        
        const payment = new Payment({
            order,
            user: req.user._id,
            amount,
            paymentMethod,
            status: 'completed',
            transactionId: `TRX-${Date.now()}`
        });
        
        await payment.save();
        
        // Update order total cost if needed
        if (orderObj.totalCost !== amount) {
            orderObj.totalCost = amount;
            await orderObj.save();
        }
        
        // Create notification for admin
        const notification = new Notification({
            user: req.user._id,
            type: 'new_payment',
            content: `تم استلام دفعة جديدة من ${req.user.name}`,
            link: `/admin/payments/${payment._id}`
        });
        
        await notification.save();
        
        res.status(201).send(payment);
    } catch (error) {
        res.status(400).send({ error: error.message });
    }
});

app.put('/api/payments/:id', auth, adminOnly, async (req, res) => {
    try {
        const updates = Object.keys(req.body);
        const allowedUpdates = ['status'];
        const isValidOperation = updates.every(update => allowedUpdates.includes(update));
        
        if (!isValidOperation) {
            return res.status(400).send({ error: 'تحديثات غير صالحة' });
        }
        
        const payment = await Payment.findById(req.params.id);
        if (!payment) {
            return res.status(404).send({ error: 'المدفوعات غير موجودة' });
        }
        
        updates.forEach(update => payment[update] = req.body[update]);
        await payment.save();
        
        // Create notification for user
        const notification = new Notification({
            user: payment.user,
            type: 'payment_status',
            content: `تم تحديث حالة الدفع إلى ${payment.status}`,
            link: `/payments/${payment._id}`
        });
        
        await notification.save();
        
        res.send(payment);
    } catch (error) {
        res.status(400).send({ error: error.message });
    }
});

app.get('/api/payments/invoice/:id', auth, async (req, res) => {
    try {
        const payment = await Payment.findById(req.params.id)
            .populate('user')
            .populate({
                path: 'order',
                populate: {
                    path: 'service'
                }
            });
        
        if (!payment) {
            return res.status(404).send({ error: 'المدفوعات غير موجودة' });
        }
        
        // Check if user has permission to view this invoice
        if (req.user.role !== 'admin' && req.user._id.toString() !== payment.user._id.toString()) {
            return res.status(403).send({ error: 'غير مصرح لك بالوصول' });
        }
        
        // In a real application, you would generate a PDF invoice here
        // For this demo, we'll just return the payment data
        
        res.send(payment);
    } catch (error) {
        res.status(500).send({ error: error.message });
    }
});

// Message routes
app.get('/api/messages', auth, async (req, res) => {
    try {
        const messages = await Message.find({
            $or: [
                { sender: req.user._id },
                { receiver: req.user._id }
            ]
        })
        .populate('sender')
        .populate('receiver')
        .populate('order')
        .sort({ createdAt: -1 });
        
        res.send(messages);
    } catch (error) {
        res.status(500).send({ error: error.message });
    }
});

app.get('/api/messages/:id', auth, async (req, res) => {
    try {
        const message = await Message.findById(req.params.id)
            .populate('sender')
            .populate('receiver')
            .populate('order');
        
        if (!message) {
            return res.status(404).send({ error: 'الرسالة غير موجودة' });
        }
        
        // Check if user has permission to view this message
        if (req.user._id.toString() !== message.sender._id.toString() && 
            req.user._id.toString() !== message.receiver._id.toString() && 
            req.user.role !== 'admin') {
            return res.status(403).send({ error: 'غير مصرح لك بالوصول' });
        }
        
        res.send(message);
    } catch (error) {
        res.status(500).send({ error: error.message });
    }
});

app.post('/api/messages', auth, upload.array('attachments', 3), async (req, res) => {
    try {
        const { receiver, order, content } = req.body;
        
        const receiverUser = await User.findById(receiver);
        if (!receiverUser) {
            return res.status(404).send({ error: 'المستلم غير موجود' });
        }
        
        const attachments = req.files ? req.files.map(file => `/uploads/${file.filename}`) : [];
        
        const message = new Message({
            sender: req.user._id,
            receiver,
            order: order || null,
            content,
            attachments
        });
        
        await message.save();
        
        // Create notification for receiver
        const notification = new Notification({
            user: receiver,
            type: 'new_message',
            content: `رسالة جديدة من ${req.user.name}`,
            link: `/messages/${message._id}`
        });
        
        await notification.save();
        
        res.status(201).send(message);
    } catch (error) {
        res.status(400).send({ error: error.message });
    }
});

app.put('/api/messages/:id/read', auth, async (req, res) => {
    try {
        const message = await Message.findById(req.params.id);
        if (!message) {
            return res.status(404).send({ error: 'الرسالة غير موجودة' });
        }
        
        // Check if user is the receiver of this message
        if (req.user._id.toString() !== message.receiver.toString()) {
            return res.status(403).send({ error: 'غير مصرح لك بالوصول' });
        }
        
        message.isRead = true;
        await message.save();
        
        res.send(message);
    } catch (error) {
        res.status(400).send({ error: error.message });
    }
});

// Notification routes
app.get('/api/notifications', auth, async (req, res) => {
    try {
        const notifications = await Notification.find({ user: req.user._id })
            .sort({ createdAt: -1 });
        
        res.send(notifications);
    } catch (error) {
        res.status(500).send({ error: error.message });
    }
});

app.put('/api/notifications/:id/read', auth, async (req, res) => {
    try {
        const notification = await Notification.findById(req.params.id);
        if (!notification) {
            return res.status(404).send({ error: 'الإشعار غير موجود' });
        }
        
        // Check if user is the owner of this notification
        if (req.user._id.toString() !== notification.user.toString()) {
            return res.status(403).send({ error: 'غير مصرح لك بالوصول' });
        }
        
        notification.isRead = true;
        await notification.save();
        
        res.send(notification);
    } catch (error) {
        res.status(400).send({ error: error.message });
    }
});

app.delete('/api/notifications/:id', auth, async (req, res) => {
    try {
        const notification = await Notification.findById(req.params.id);
        if (!notification) {
            return res.status(404).send({ error: 'الإشعار غير موجود' });
        }
        
        // Check if user is the owner of this notification
        if (req.user._id.toString() !== notification.user.toString()) {
            return res.status(403).send({ error: 'غير مصرح لك بالوصول' });
        }
        
        await notification.remove();
        res.send(notification);
    } catch (error) {
        res.status(500).send({ error: error.message });
    }
});

// Project routes
app.get('/api/projects', async (req, res) => {
    try {
        const projects = await Project.find({}).sort({ completionDate: -1 });
        res.send(projects);
    } catch (error) {
        res.status(500).send({ error: error.message });
    }
});

app.get('/api/projects/:id', async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);
        if (!project) {
            return res.status(404).send({ error: 'المشروع غير موجود' });
        }
        res.send(project);
    } catch (error) {
        res.status(500).send({ error: error.message });
    }
});

app.post('/api/projects', auth, adminOnly, upload.array('images', 10), async (req, res) => {
    try {
        const { name, description, category, completionDate } = req.body;
        
        const images = req.files ? req.files.map(file => `/uploads/${file.filename}`) : [];
        
        const project = new Project({
            name,
            description,
            category,
            images,
            completionDate: completionDate || new Date()
        });
        
        await project.save();
        res.status(201).send(project);
    } catch (error) {
        res.status(400).send({ error: error.message });
    }
});

app.put('/api/projects/:id', auth, adminOnly, upload.array('images', 10), async (req, res) => {
    try {
        const updates = Object.keys(req.body);
        const allowedUpdates = ['name', 'description', 'category', 'completionDate'];
        const isValidOperation = updates.every(update => allowedUpdates.includes(update));
        
        if (!isValidOperation) {
            return res.status(400).send({ error: 'تحديثات غير صالحة' });
        }
        
        const project = await Project.findById(req.params.id);
        if (!project) {
            return res.status(404).send({ error: 'المشروع غير موجود' });
        }
        
        updates.forEach(update => project[update] = req.body[update]);
        
        if (req.files && req.files.length > 0) {
            const newImages = req.files.map(file => `/uploads/${file.filename}`);
            project.images = [...project.images, ...newImages];
        }
        
        await project.save();
        res.send(project);
    } catch (error) {
        res.status(400).send({ error: error.message });
    }
});

app.delete('/api/projects/:id', auth, adminOnly, async (req, res) => {
    try {
        const project = await Project.findByIdAndDelete(req.params.id);
        if (!project) {
            return res.status(404).send({ error: 'المشروع غير موجود' });
        }
        res.send(project);
    } catch (error) {
        res.status(500).send({ error: error.message });
    }
});

app.post('/api/projects/:id/images', auth, adminOnly, upload.array('images', 10), async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);
        if (!project) {
            return res.status(404).send({ error: 'المشروع غير موجود' });
        }
        
        const images = req.files.map(file => `/uploads/${file.filename}`);
        project.images = [...project.images, ...images];
        
        await project.save();
        res.send(project);
    } catch (error) {
        res.status(400).send({ error: error.message });
    }
});

// Serve static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
