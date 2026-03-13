const Agreement = require('../models/Agreement');

// Create new agreement
exports.addAgreement = async (req, res) => {
    try {
        const { vendor_name, description, amount, start_date, end_date } = req.body;

        const newAgreement = await Agreement.create({
            vendor_name,
            description,
            amount,
            start_date,
            end_date
        });

        res.status(201).json({ message: 'Agreement saved successfully', data: newAgreement });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Get all agreements
exports.getAllAgreements = async (req, res) => {
    try {
        const agreements = await Agreement.findAll();
        res.status(200).json(agreements);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Update agreement
exports.updateAgreement = async (req, res) => {
    try {
        const { id } = req.params;
        const { vendor_name, description, amount, start_date, end_date } = req.body;

        const agreement = await Agreement.findByPk(id);

        if (!agreement) {
            return res.status(404).json({ message: 'Agreement not found' });
        }

        await agreement.update({
            vendor_name,
            description,
            amount,
            start_date,
            end_date
        });

        res.status(200).json({
            message: 'Agreement updated successfully',
            data: agreement
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: 'Server error',
            error: error.message
        });
    }
};


// Delete agreement
exports.deleteAgreement = async (req, res) => {
    try {
        const { id } = req.params;

        const agreement = await Agreement.findByPk(id);

        if (!agreement) {
            return res.status(404).json({ message: 'Agreement not found' });
        }

        await agreement.destroy();

        res.status(200).json({ message: 'Agreement deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: 'Server error',
            error: error.message
        });
    }
};

