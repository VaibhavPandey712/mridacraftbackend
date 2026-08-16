import addressModel from "../models/address.model.js";

/** GET /api/addresses */
export async function listAddresses(req, res) {
    try {
        const addresses = await addressModel.find({ user: req.user._id }).sort({ createdAt: -1 });
        res.status(200).json(addresses);
    } catch (err) {
        res.status(500).json({ message: "Error fetching addresses" });
    }
}

/** POST /api/addresses */
export async function createAddress(req, res) {
    try {
        const userId = req.user._id;
        const { fullName, phone, house, street, landmark, city, state, pincode, country, isDefault } = req.body;

        const count = await addressModel.countDocuments({ user: userId });
        const shouldBeDefault = count === 0 ? true : Boolean(isDefault);

        if (shouldBeDefault) {
            await addressModel.updateMany({ user: userId }, { $set: { isDefault: false } });
        }

        const address = await addressModel.create({
            user: userId,
            fullName,
            phone,
            house,
            street,
            landmark,
            city,
            state,
            pincode,
            country: country || "India",
            isDefault: shouldBeDefault,
        });

        res.status(201).json({ message: "Address saved successfully", address });
    } catch (error) {
        console.error("Error saving address:", error);
        res.status(500).json({ message: error.message || "Internal server error" });
    }
}

/** PUT /api/addresses/:id */
export async function updateAddress(req, res) {
    try {
        const userId = req.user._id;
        const { id } = req.params;

        if (req.body.isDefault) {
            await addressModel.updateMany({ user: userId }, { $set: { isDefault: false } });
        }

        const address = await addressModel.findOneAndUpdate(
            { _id: id, user: userId },
            { $set: req.body },
            { new: true, runValidators: true }
        );
        if (!address) return res.status(404).json({ message: "Address not found" });
        res.status(200).json({ message: "Address updated", address });
    } catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
}

/** PUT /api/addresses/:id/default */
export async function setDefaultAddress(req, res) {
    try {
        const userId = req.user._id;
        const { id } = req.params;
        await addressModel.updateMany({ user: userId }, { $set: { isDefault: false } });
        const address = await addressModel.findOneAndUpdate(
            { _id: id, user: userId },
            { $set: { isDefault: true } },
            { new: true }
        );
        if (!address) return res.status(404).json({ message: "Address not found" });
        res.status(200).json({ message: "Default address updated", address });
    } catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
}

/** DELETE /api/addresses/:id */
export async function deleteAddress(req, res) {
    try {
        const userId = req.user._id;
        const { id } = req.params;
        const deleted = await addressModel.findOneAndDelete({ _id: id, user: userId });
        if (!deleted) return res.status(404).json({ message: "Address not found" });

        if (deleted.isDefault) {
            const another = await addressModel.findOne({ user: userId });
            if (another) {
                another.isDefault = true;
                await another.save();
            }
        }
        res.status(200).json({ message: "Address deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
}
