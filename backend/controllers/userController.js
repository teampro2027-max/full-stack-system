const User = require('../models/User');

const getUsers = async (req, res) => {
    try {
        const users = await User.find({}).select('-password');
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

const deleteUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        await User.deleteOne({ _id: req.params.id });

        res.json({ message: 'User removed' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

const getMyProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password');
        if (user) {
            res.json(user);
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

const updateUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        if (user) {
            if (req.body.name) {
                if (!/^[a-zA-Z\s]+$/.test(req.body.name.trim())) {
                    return res.status(400).json({ message: 'Name can only contain letters and spaces' });
                }
                user.name = req.body.name.trim();
            }
            if (req.body.phone) {
                const cleanPhone = req.body.phone.replace(/\D/g, '');
                if (!/^\d+$/.test(cleanPhone)) {
                    return res.status(400).json({ message: 'Phone must contain only numbers' });
                }
                user.phone = cleanPhone;
            }
            user.profilePicture = req.body.profilePicture || user.profilePicture;

            if (req.body.password) {
                user.password = req.body.password;
            }

            // Only update email if provided and not already used
            if (req.body.email && req.body.email !== user.email) {
                const emailExists = await User.findOne({ email: req.body.email });
                if (emailExists) {
                    return res.status(400).json({ message: 'Email already in use' });
                }
                user.email = req.body.email;
            }

            const updatedUser = await user.save();
            res.json({
                _id: updatedUser._id,
                name: updatedUser.name,
                email: updatedUser.email,
                phone: updatedUser.phone,
                profilePicture: updatedUser.profilePicture,
                role: updatedUser.role,
                mfaEnabled: updatedUser.mfaEnabled,
                preferredLanguage: updatedUser.preferredLanguage,
                notificationsEnabled: updatedUser.notificationsEnabled,
            });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = { getUsers, deleteUser, getMyProfile, updateUserProfile };
