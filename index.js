    import express from 'express';
    import dbPool from './db.js'; // Import the connection pool
    import bodyParser from 'body-parser';
    import { v4 as uuidv4, parse as uuidParse } from 'uuid';
    import bcrypt from 'bcrypt';

    const app = express();
    const port = 3000;
    const saltRounds = 10;

    app.use(bodyParser.json());

    app.use(bodyParser.urlencoded({ extended: true }));

    let login_id;
    let isLogged = false;

(async () => {
  try {
    const [rows] = await dbPool.query('SELECT id FROM students WHERE uid IS NULL');

    for (const row of rows) {
      const newUuid = uuidv4(); // create a unique UUID
      const uuidBuffer = Buffer.from(uuidParse(newUuid)); // convert to binary(16)

      await dbPool.query(
        'UPDATE students SET uid = ? WHERE id = ?',
        [uuidBuffer, row.id]
      );
    }

    console.log(`Updated ${rows.length} students with new UUIDs.`);
  } catch (err) {
    console.error('Error updating UUIDs:', err);
  }
})();

    async function hashPassword(plainPassword) {
  const hashedPassword = await bcrypt.hash(plainPassword, saltRounds);
  return hashedPassword;
}

    async function verifyPassword(plainPassword, hashedPassword) {
  const match = await bcrypt.compare(plainPassword, hashedPassword);
  return match;
}

    app.get('/users/:id', async (req, res) => {
        const user_id = req.params.id;
        // console.log("id "+user_id)
    try { 
        const [rows] = await dbPool.query(
            `SELECT BIN_TO_UUID(uid) AS uid, id, name, email, phone, date_of_birth FROM students WHERE user_id = ?;`,
            [user_id]
        );
        res.json(rows);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).send('Error fetching users');
    }
});

    app.get('/user/:uid/:login_id', async (req, res) => {
    const uid = req.params.uid;
    const id = req.params.login_id;
    console.log("uid"+uid);
    console.log("id"+id);
    try {
        const [rows] = await dbPool.query(
            `SELECT BIN_TO_UUID(uid) AS uid, id, name, email, phone, date_of_birth FROM students WHERE uid = UUID_TO_BIN(?) AND user_id = ${id}`,
            [uid]
        );
        res.json(rows);
    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).send('Error fetching user');
    }
}); 

    // Create new user 
    app.post('/create/:login_id', async (req, res) => {
        const login_id = req.params.login_id;
    const { name, email, phone, date_of_birth: date } = req.body.data;

    // const { name, email, phone, date_of_birth: date } = req.body.data;

    try {
        const newUuid = uuidv4();
        const uuidBuffer = Buffer.from(uuidParse(newUuid));

        // await dbPool.query(
        //     'INSERT INTO students (uid, name, email, phone, date_of_birth) VALUES (?, ?, ?, ?, ?)',
        //     [uuidBuffer, name, email, phone, date]
        // );

        await dbPool.query(
            'INSERT INTO students (uid, name, email, phone, date_of_birth, user_id) VALUES (?, ?, ?, ?, ?, ?)',
            [uuidBuffer, name, email, phone, date, login_id]
        );

        res.json({ status: 'success', uid: newUuid });
    } catch (error) {
        console.error('Error creating user:', error);
        res.status(500).send('Error creating user');
    }
});

    // Update user 
    app.post('/update/:user_id', async (req, res) => {
        const id = req.body.data.id;
        const name = req.body.data.name;
        const email = req.body.data.email;
        const phone = req.body.data.phone;
        const date = req.body.data.date_of_birth;
        const user_id = req.params.user_id;
        // Get existing user details 
         try {
            // Update user details 
            try {
            await dbPool.query(`UPDATE students SET name='${name}', email='${email}', phone='${phone}', date_of_birth='${date}' WHERE id='${id}' AND user_id='${user_id}';`);
            res.json("Sucess");
        } catch (error) {
            console.error('Error updating user field(s):', error);
            res.status(500).send('Error updating user field(s)');
        }
        } catch (error) {
            console.error('User does not exist:', error);
            res.status(500).send('User does not exist');
        }
    });

    // Delete user 
     app.post('/delete/:user_id', async (req, res) => {
        const id = req.body.id;
        const user_id = req.params.user_id;
        console.log(id)
        // Error deleting user 
        try {
            await dbPool.query(`DELETE FROM students WHERE id='${id}' AND user_id=${user_id};`);
            res.json("Sucess");
        } catch (error) {
            console.error('Error deleting user:', error);
            res.status(500).send('Error deleting users');
        }
    });

    app.listen(port, () => {
        console.log(`Server running on http://localhost:${port}`);
    });

    // registration 
    app.post('/register', async (req, res) => {
        let message;
        const {full_name, email, password, retypePassword} = req.body.data;
        console.log("full name"+full_name);
        console.log("email"+email);
        // console.log("password"+password);
        // console.log("retype password"+retypePassword); 

        async function checkIfUnique(email){
            const data = email;
            console.log(data)
            const result = await dbPool.query(`SELECT id FROM users WHERE email='${data}';`);
            console.log(result[0][0])
            const unique = result[0][0];
            if(!unique){
                console.log("null")
                return null;
            } else {
                console.log("unique")
                return unique.id;
            }
        }

         if (!full_name || full_name.trim().length === 0) {
    return res.status(400).json({ message: "Full name cannot be empty!" });
  }

  if (!email || email.trim().length === 0) {
    return res.status(400).json({ message: "Email cannot be empty!" });
  }

  if (!password || password.trim().length === 0) {
    return res.status(400).json({ message: "Password cannot be empty!" });
  }

  if (!retypePassword || retypePassword.trim().length === 0) {
    return res.status(400).json({ message: "Retype password cannot be empty!" });
  }

  if (password !== retypePassword) {
    return res.status(400).json({ message: "Password and Retype password must match!" });
  }

        try {
    const [rows] = await dbPool.query(`SELECT id FROM users WHERE email = ?`, [email]);

    if (rows.length > 0) {
      return res.status(400).json({ message: "Email is already in use!" });
    }

    const hPassword = await hashPassword(password);

    await dbPool.query(
      `INSERT INTO users (full_name, email, password) VALUES (?, ?, ?)`,
      [full_name, email, hPassword]
    );

    return res.status(201).json({ message: "User registered successfully!" });
  } catch (error) {
    console.error("Error registering user:", error);
    return res.status(500).json({ error: "Server error. Please try again later." });
  }   
    });

    // login 
    app.post('/login', async (req, res) => {
        const {email, password} = req.body.data; 
        let user = "";

         if (!email || email.trim().length === 0) {
    return res.status(400).json({ message: "Email cannot be empty!" });
  }

  if (!password || password.trim().length === 0) {
    return res.status(400).json({ message: "Password cannot be empty!" });
  }

        const hashed = await hashPassword(password);

        try {
            const result = await dbPool.query(`SELECT id, password FROM users WHERE email = '${email}';`);
            const user = result[0][0].id;
            const dbPassword = result[0][0].password;
            const isMatch = await verifyPassword(password, dbPassword);
            console.log("Password matches:", isMatch);

            if(isMatch === true){
                // res.redirect(`/users/${user}`);
                res.json(user)
            } else {
                return res.status(400).json({ message: "Invalid Email and/or Password combination" });
            }
            
        } catch (error) {
            console.log(`Invalid Email and/or Password combination `+error);
            return res.status(500).json({ error: "Server error. Please try again later." });
        }
    })
