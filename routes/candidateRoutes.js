const express = require("express");
const router = express.Router();

const Candidate = require("./../models/candidate");
const { jwtAuthMiddleware, generateToken } = require("./../jwt");
const User = require("../models/user");

const checkAdminRole = async (userID) => {
  try {
    const user = await User.findById(userID);
    if (user.role === "admin") return true;
  } catch (err) {
    return false;
  }
};

//post route to add a candidate
router.post("/", jwtAuthMiddleware, async (req, res) => {
  try {
    if (!(await checkAdminRole(req.user.id)))
      return res
        .status(403)
        .json({ message: "User does not have admin role." });

    const data = req.body; //Assuming the request body contains the candidate data
    //create a new candidate document using the mongoose model
    const newCandidate = new Candidate(data);
    //save the new candidate to the database
    const response = await newCandidate.save();
    console.log("Data saved");
    res.status(200).json({ response: response });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Internal server error." });
  }
});

router.put("/:candidateID", jwtAuthMiddleware, async (req, res) => {
  try {
    if (!checkAdminRole(req.user.id))
      return res
        .status(403)
        .json({ message: "User does not have admin role." });
    const candidateID = req.params.candidateID; //Extract the ID from the URL parameter
    const updatedCandidateData = req.body(); //Updated data for the candidate
    const response = await Candidate.findByIdAndUpdate(
      candidateID,
      updatedCandidateData,
      {
        new: true, //Return the updated document
        runValidators: true, //Run mongoose validation
      }
    );
    if (!response) {
      return res.status(404).json({ error: "Candidate not found" });
    }
    console.log("Candidate data updated.");
    res.status(200).json(response);
  } catch (err) {
    console.log(err);
    res.status(500).json({ err: "Internal server error." });
  }
});

router.delete("/:candidateID", jwtAuthMiddleware, async (req, res) => {
  try {
    if (!checkAdminRole(req.user.id))
      return res
        .status(403)
        .json({ message: "User does not have admin role." });
    const candidateID = req.params.candidateID; //Extract the ID from the URL parameter

    const response = await Candidate.findByIdAndDelete(candidateID);
    if (!response) {
      return res.status(404).json({ error: "Candidate not found." });
    }
    console.log("Candidate deleted.");
    res.status(200).json(response);
  } catch (err) {
    console.log(err);
    res.status(500).json({ err: "Internal server error." });
  }
});

//let's start voting
router.post("/vote/:candidateID", jwtAuthMiddleware, async (req, res) => {
  //no admin can vote
  //user can only vote once
  const candidateID = req.params.candidateID;
  const userId = req.user.id;
  try {
    //find the candidate document with the specified candidateID
    const candidate = await Candidate.findById(candidateID);
    if (!candidate) {
      return res.status(404).json({ message: "Candidate not found." });

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found." });
      }
      if (user.isVoted) {
        return res.status(400).json({ message: "You have already voted." });
      }
      if (user.role == "admin") {
        return res.status(403).json({ message: "Admin is not allowed." });
      }
      //update the candidate document to record the vote
      candidate.votes.push({ user: userID });
      candidate.voteCount++;
      await candidate.save();

      //update the user document
      user.isVoted = true;
      await user.save();
      res.status(200).json({ message: "Vote recorded successfully." });
    }
  } catch (err) {
    console.log(err);
    res.status(500).json({ err: "Internal server error." });
  }
});
//vote count
router.get("/vote/count", async (req, res) => {
  try {
    //Find all candidate and sort them by voteCount and descending order
    const candidate = await Candidate.find().sort({ voteCount: "desc" });
    //map the candidates to only return their name and voteCount
    const voteRecord = candidate.map((data) => {
      return {
        party: data.party,
        count: data.voteCount,
      };
    });
    return res.status(200).json(voteRecord);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Internal server error." });
  }
});

// Get List of all candidates with only name and party fields
router.get("/", async (req, res) => {
  try {
    // Find all candidates and select only the name and party fields, excluding _id
    const candidates = await Candidate.find({}, "name party -_id");

    // Return the list of candidates
    res.status(200).json(candidates);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
