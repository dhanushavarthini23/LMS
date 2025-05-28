import bcrypt from 'bcrypt';
import AppDataSource from './data-source';
const hashPassword = async (plainPassword: string) => {
  const saltRounds = 10;
  console.log(`Hashing password: ${plainPassword}`);
  return await bcrypt.hash(plainPassword, saltRounds);
};


const hashExistingPasswords = async () => {
  try {
    await AppDataSource.initialize(); 

    const query = 'SELECT * FROM employees WHERE password IS NOT NULL';
    const users = await AppDataSource.query(query);

    if (users.length === 0) {
      console.log('No users found with plain-text passwords.');
      return;
    }

    for (const user of users) {
      console.log(`Checking user ID: ${user.id}, Username: ${user.username}`);

      if (!user.password.startsWith('$2b$')) {
        console.log(`Hashing password for user ID: ${user.id}`);
        const hashedPassword = await hashPassword(user.password);

        const updateQuery = 'UPDATE employees SET password = $1 WHERE id = $2';
        await AppDataSource.query(updateQuery, [hashedPassword, user.id]);
        console.log(`Updated password for user ID: ${user.id}`);
      } else {
        console.log(`User ID: ${user.id} already has a hashed password.`);
      }
    }

    await AppDataSource.destroy(); 
  } catch (error) {
    console.error('Error hashing existing passwords:', error);
  }
};
hashExistingPasswords();
