const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres:!krishaSamar135531@findateammate.c5gsecs0mjfj.ap-south-2.rds.amazonaws.com:5432/postgres'
});

(async () => {
  try {
    await client.connect();
    console.log('Connected to database');
    
    // Find organizer account
    const userResult = await client.query(
      `SELECT id, email, name, "isOrganiser" FROM users WHERE email = $1`,
      ['findateammate.ahilight@gmail.com']
    );
    
    if (userResult.rows.length === 0) {
      console.log('Organizer not found');
      process.exit(1);
    }
    
    const user = userResult.rows[0];
    console.log('\nOrganizer User:');
    console.log(user);
    
    // Find their recent intra-college events
    const eventsResult = await client.query(
      `SELECT id, "eventName", "eventType", "isEventOrganiser", "crossDeptRequiresApproval", "createdAt" 
       FROM posts WHERE "userId" = $1 AND "eventName" IS NOT NULL AND "eventType" = 'intra-college'
       ORDER BY "createdAt" DESC LIMIT 5`,
      [user.id]
    );
    
    console.log('\nRecent Intra-College Events:');
    eventsResult.rows.forEach(event => {
      console.log(event);
    });
    
    // Check registrations for each event
    if (eventsResult.rows.length > 0) {
      const eventId = eventsResult.rows[0].id;
      console.log(`\nChecking registrations for event ${eventId}:`);
      
      const regsResult = await client.query(
        `SELECT id, "userId", status, "registrationType" FROM event_registrations WHERE "postId" = $1`,
        [eventId]
      );
      
      regsResult.rows.forEach(reg => {
        console.log(reg);
      });
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
  }
})();
