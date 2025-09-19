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
        const {full_name, email, password, retypePassword} = req.body;
        console.log(full_name);
        console.log(email);
        console.log(password);
        console.log(retypePassword);

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

        if (!full_name || full_name.trim().length === 0 ) {
            res.json("Full name cannot be empty.")
        }

         if (!email || email.trim().length === 0) {
        // Input is null, undefined, empty, or contains only whitespace
            res.json("Email cannot be empty.")
        }

        if (!password || password.trim().length === 0) {
            res.json("Password cannot be empty")
        }

        if (!retypePassword || retypePassword.trim().length === 0) {
            res.json("Retype password cannot be empty")
        }

        if (password !== retypePassword) {
            res.json("Password and Retype password must match")
        }

        try {
            const result = await checkIfUnique(email);
            console.log("Result: "+result);
            if (result) {
                console.log('Email already in use! ');
                res.json("Email must be unique")
            }
            
        const hPassword = await hashPassword(password);
        
            try {
                        await dbPool.query(`INSERT INTO users (full_name, email, password) VALUES (?, ?, ?)`,
                            [full_name, email, hPassword]
                        );
                        res.json("Success");
                    } catch (error) {
                        console.log('Error registering user: ', error);
                        res.status(500).send('Error registering user');
                    }

        } catch (error) {
            console.log('Error, could not check for email duplicates: '+error);
        }

        
    });

    // login 
    app.post('/login', async (req, res) => {
        const {email, password} = req.body.data;
        // const {email, password} = req.body;



        let user = "";
        // console.log(email);
        // console.log(password);

        const hashed = await hashPassword(password);
        // console.log(hashed);

        try {
            const result = await dbPool.query(`SELECT id, password FROM users WHERE email = '${email}';`);
            // console.log(result)
            const user = result[0][0].id;
            // console.log(user)
            const dbPassword = result[0][0].password;
            // console.log(dbPassword)
            // console.log(hashed)

            const isMatch = await verifyPassword(password, dbPassword);
            // console.log("Password matches:", isMatch);

            if(isMatch){
                // res.redirect(`/users/${user}`);
                res.json(user)
            } else {
                res.json("Password incorrect")
            }

            // console.log(user[0][0].id);
            // res.json(user);
            
        } catch (error) {
            console.log(`Invalid Email and/or Password combination `+error);
            res.status(500).send(`Invalid Email and/or Password combination `+error);
        }
    })
