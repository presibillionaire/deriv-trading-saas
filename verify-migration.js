const { Pool } = require('pg');
require('dotenv').config();

async function verify() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    connectionTimeoutMillis: 10000,
  });

  try {
    const client = await pool.connect();
    console.log('✅ Connected to database\n');

    // Get table structure
    const result = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'APITokens'
      ORDER BY ordinal_position
    `);

    if (result.rows.length === 0) {
      console.error('❌ APITokens table not found!');
      client.release();
      await pool.end();
      process.exit(1);
    }

    console.log('📋 APITokens Table Columns:');
    console.log('─'.repeat(70));
    result.rows.forEach(row => {
      const nullable = row.is_nullable === 'YES' ? 'nullable' : 'NOT NULL';
      console.log(`  ${row.column_name.padEnd(25)} ${row.data_type.padEnd(20)} ${nullable}`);
    });
    console.log('─'.repeat(70));

    // Check for new columns
    const columns = result.rows.map(r => r.column_name);
    const requiredColumns = [
      'tokenIV',
      'tokenAuthTag',
      'derivTokenEncrypted',
      'expiresAt',
      'lastAccessedAt',
      'rotatedAt',
      'revocationReason'
    ];

    console.log('\n✅ Migration Verification:');
    let allPresent = true;
    requiredColumns.forEach(col => {
      if (columns.includes(col)) {
        console.log(`  ✓ ${col}`);
      } else {
        console.log(`  ✗ ${col} MISSING`);
        allPresent = false;
      }
    });

    // Check balance precision
    const balance = result.rows.find(r => r.column_name === 'balance');
    console.log(`\n💰 Balance Type: ${balance.data_type}`);
    if (balance.data_type.includes('15')) {
      console.log('   ✓ Correct precision (DECIMAL 15,4)');
    } else {
      console.log('   ✗ Wrong precision - should be DECIMAL(15,4)');
      allPresent = false;
    }

    if (allPresent) {
      console.log('\n✅ All checks passed! Migration successful!');
    } else {
      console.log('\n❌ Some columns missing. Run: npx sequelize-cli db:migrate');
    }

    client.release();
    await pool.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

verify();
