const { User } = require('./src/models');
const { Op } = require('sequelize');

async function verify() {
  try {
    // Search for any email containing 'admin' to avoid case-sensitivity issues
    const users = await User.findAll({ 
      where: { email: { [Op.like]: '%admin%' } } 
    });

    if (users.length === 0) {
      console.log('❌ No users found containing "admin".');
      const all = await User.findAll();
      console.log('Actual emails in DB:', all.map(u => u.email));
      process.exit(1);
    }

    for (const user of users) {
      await user.update({ isEmailVerified: true });
      console.log(`✅ Success: ${user.email} is now verified.`);
    }
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}
verify();
