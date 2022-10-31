const { count } = require("console");
const express = require("express");
const { type } = require("os");
const { isNativeError } = require("util/types");
const app = express();
const database = require("./database/configurationDB");
const errResponse = require("./errorAndResponse");

const port = 3000;

app.use(express.json());

app.get("/trains", (req, res, next) => {
  database.query("SELECT * FROM TrainsInfo", (err, result) => {
    if (err) console.log(err);

    res.json(result.rows);
  });
});

app.listen(port, () => {
  console.log(`Listening on port : ${port}`);
});

// get Booking table from database

app.get("/booking", (request, response) => {
  database.query(
    "SELECT * FROM Bookings ORDER BY Booking_id ASC ",
    (err, res) => {
      if (err) console.log(err);

      response.json(res.rows);
    }
  );
});

//get request Left Join of TrainInfo and Bookings

app.get("/booking/:trainNumber/:date", (request, response) => {
  const trainNo = parseInt(request.params.trainNumber);
  const { date } = request.params;

  console.log("Train Number is : " + trainNo);
  console.log(`date format Input: ${date}`);

  console.log("type of TrainNo : " + typeof trainNo);
  console.log("date : " + typeof date);

  database.query(
    `SELECT 
      Train_No,
      Train_Name,
      Train_From, 
      Train_To,
      Booking_id
      Book_Train_id,
      Book_Date,
      Seat_1,
      Seat_2,
      Seat_3,
      Seat_4,
      Book_Train_Name 
    
     FROM TrainsInfo LEFT JOIN Bookings ON Bookings.Book_Train_id = TrainsInfo.Train_id WHERE TrainsInfo.Train_No =  ${trainNo}   AND  Bookings.Book_Date = '${date}'`,
    (err, res) => {
      if (err) {
        response.json("Sorry, Train Not Available!");
      }
      if (res.rows[0].length <= 0) {
        response.json(errResponse);
      } else {
        response.json(res.rows[0]);
      }
    }
  );
});

//Booking Seats

app.put("/booking/:trainNumber/:date/:seats", (request, response) => {
  const trainNo = parseInt(request.params.trainNumber);
  const date = request.params.date;
  const seats = request.params.seats;
  var newData;

  const table_one = database.query(
    `SELECT
    Train_No,
    Train_Name,
    Train_From, 
    Train_To,
    Booking_id,
    Book_Train_id,
    Book_Date,
    Seat_1,
    Seat_2,
    Seat_3,
    Seat_4,
    Book_Train_Name   
    FROM TrainsInfo LEFT JOIN Bookings 
    ON Bookings.Book_Train_id = TrainsInfo.Train_id 
    WHERE TrainsInfo.Train_No =  ${trainNo}   AND  Bookings.Book_Date = '${date}'`,
    (err, res) => {
      if (err) {
        console.log(err);
      }

      const data = res.rows[0];
      const counts = data.seat_1 + data.seat_2 + data.seat_3 + data.seat_4;

      //Current Train Details

      const BookingId = data.booking_id;

      let setQuery = "SET ";
      if (seats <= counts) {
        if (data.seat_1 === 1) {
          setQuery += "Seat_1 = 0";
        } else if (data.seat_2 === 1) {
          setQuery += "Seat_2 = 0";
        } else if (data.seat_3 === 1) {
          setQuery += "Seat_3 = 0";
        } else if (data.seat_4 === 1) {
          setQuery += "Seat_4 = 0";
        } else if (data.seat_1 === 1 && data.seat_2 === 1) {
          setQuery += "Seat_1 = 0, Seat_2 = 0";
        } else if (
          data.seat_1 === 1 &&
          data.seat_2 === 1 &&
          data.seat_3 === 1
        ) {
          setQuery += "Seat_1 = 0, Seat_2 = 0, Seat_3 = 0";
        } else if (
          data.seat_1 === 1 &&
          data.seat_2 === 1 &&
          data.seat_3 === 1 &&
          data.seat_4 === 1
        ) {
          setQuery += "Seat_1 = 0, Seat_2 = 0, Seat_3 = 0, Seat_4 = 0";
        }
      } else {
        //Object for Error

        const notAvailable = {
          Train_Number: `${trainNo}`,
          Date: `${date}`,
          message: "Seats Not Available",
          Status: "Failed",
        };

        response.json(notAvailable);
        return;
      }

      // else if( data.seat_1 == 0 && data.seat_2 == 0 && data.seat_3 == 0 && data.seat_4 == 0){
      //   response.json("Sorry, Seats not Available");
      // }

      const firstValue = counts - seats;
      console.log(firstValue);

      console.log("Set Query Values");
      console.log(setQuery);

      database.query(
        `UPDATE Bookings ${setQuery} WHERE Booking_id = ${BookingId} `,
        (err, res) => {
          if(err) { console.log(err); }
          else{ 

            const currentTrainDetails = {
              Train_Number: `${trainNo}`,
              Date: `${date}`,
              Seats: `${seats}`,
              Status: "Passed",
              message: "Successfully Booked",
            };
            response.json(currentTrainDetails);
          }
          
        }
        
      );
    }
  );
});

//get Avaiable_Dates Table from database

app.get("/dates", (request, response) => {
  database.query("SELECT * FROM Available_Dates", (err, res) => {
    if (err) console.log(err);

    response.json(res.rows);
  });
});

//Post Request to database

app.post("/trains", (request, response) => {
  const {
    Train_id,
    Train_No,
    Train_name,
    Train_From,
    Train_To,
    Available_Seats,
  } = request.body;

  database.query(
    "INSERT INTO TrainsInfo(Train_id, Train_No, Train_name, Train_From, Train_To, Available_Seats) VALUES($1, $2, $3, $4, $5, $6) RETURNING *",
    [Train_id, Train_No, Train_name, Train_From, Train_To, Available_Seats],
    (err, res) => {
      if (err) {
        console.log("From inserting values error");
        console.log("Error Occured");
      }

      response.redirect("/trains");
    }
  );
});
