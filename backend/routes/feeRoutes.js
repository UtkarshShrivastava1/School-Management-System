const express = require('express');
const router = express.Router();
const Fee = require('../models/FeeModel');
const { verifyAdminToken, verifyTeacherToken, verifyAdminOrTeacherToken } = require('../middleware/authMiddleware');
const feeController = require('../controllers/feeController');

// Get all fees
router.get('/', verifyAdminToken, async (req, res) => {
    try {
        const fees = await Fee.find()
            .populate('student', 'name rollNumber')
            .populate('class', 'name')
            .populate('createdBy', 'name');
        res.json(fees);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Fee approval routes - must be before /:id route
router.get('/pending-approvals', verifyAdminOrTeacherToken, feeController.getPendingApprovals);
router.post('/:feeId/approve', verifyAdminOrTeacherToken, feeController.handleFeeApproval);

// Get fees by class
router.get('/class/:classId', [verifyAdminToken, verifyTeacherToken], async (req, res) => {
    try {
        const fees = await Fee.find({ class: req.params.classId })
            .populate('student', 'name rollNumber')
            .populate('class', 'name')
            .populate('createdBy', 'name');
        res.json(fees);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get fees by student
router.get('/student/:studentId', [verifyAdminToken, verifyTeacherToken], async (req, res) => {
    try {
        const fees = await Fee.find({ student: req.params.studentId })
            .populate('student', 'name rollNumber')
            .populate('class', 'name')
            .populate('createdBy', 'name');
        res.json(fees);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get fee by ID
router.get('/:id', [verifyAdminToken, verifyTeacherToken], async (req, res) => {
    try {
        const fee = await Fee.findById(req.params.id)
            .populate('student', 'name rollNumber')
            .populate('class', 'name')
            .populate('createdBy', 'name');
        if (!fee) {
            return res.status(404).json({ message: 'Fee not found' });
        }
        res.json(fee);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Create new fee
router.post('/', verifyAdminToken, async (req, res) => {
    const fee = new Fee({
        student: req.body.student,
        class: req.body.class,
        academicYear: req.body.academicYear,
        feeType: req.body.feeType,
        amount: req.body.amount,
        dueDate: req.body.dueDate,
        status: req.body.status || 'pending',
        description: req.body.description,
        totalAmount: req.body.totalAmount || req.body.amount,
        createdBy: req.user._id
    });

    try {
        const newFee = await fee.save();
        const populatedFee = await Fee.findById(newFee._id)
            .populate('student', 'name rollNumber')
            .populate('class', 'name')
            .populate('createdBy', 'name');
        res.status(201).json(populatedFee);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Update fee
router.patch('/:id', verifyAdminToken, async (req, res) => {
    try {
        const fee = await Fee.findById(req.params.id);
        if (!fee) {
            return res.status(404).json({ message: 'Fee not found' });
        }

        // Only allow updating certain fields
        const allowedUpdates = [
            'status', 'paymentDate', 'paymentMethod', 'transactionId',
            'lateFeeAmount', 'totalAmount', 'description', 'paymentDetails'
        ];

        Object.keys(req.body).forEach(key => {
            if (allowedUpdates.includes(key)) {
                fee[key] = req.body[key];
            }
        });

        const updatedFee = await fee.save();
        const populatedFee = await Fee.findById(updatedFee._id)
            .populate('student', 'name rollNumber')
            .populate('class', 'name')
            .populate('createdBy', 'name');
        res.json(populatedFee);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Delete fee
router.delete('/:id', verifyAdminToken, async (req, res) => {
    try {
        const fee = await Fee.findById(req.params.id);
        if (!fee) {
            return res.status(404).json({ message: 'Fee not found' });
        }

        await fee.deleteOne();
        res.json({ message: 'Fee deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Class fee management routes
router.post('/class-fee/update', verifyAdminToken, feeController.updateClassFee);

// Enhanced fee management routes
router.get('/class/:classId/fee-history', verifyAdminToken, feeController.getClassFeeHistory);
router.post('/generate-monthly-fees', verifyAdminToken, feeController.generateMonthlyFees);
router.get('/comprehensive-stats', verifyAdminToken, feeController.getComprehensiveFeeStats);
router.get('/student/:studentId/class/:classId/fee-history', verifyAdminToken, feeController.getStudentFeeHistory);

// Get monthly fee records for a class
router.get('/class/:classId/records', verifyAdminToken, feeController.getClassMonthlyFeeRecords);

// Get payment history for a class
router.get('/class/:classId/payment-history', verifyAdminToken, feeController.getClassPaymentHistory);

module.exports = router; 