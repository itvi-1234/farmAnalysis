// User controller

export const getProfile = async (req, res) => {
  try {
    
    const user = req.user;
    
    res.json({ user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { name, phone, address } = req.body;
  
    
    res.json({ message: 'Profile updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

