const Message = require('../models/message');

// exports.saveMessage = async (sender, recipient, message) => {
//   try {
//     const newMessage = new Message({
//       sender,
//       recipient,
//       message
//     });
//     await newMessage.save();
//     return newMessage;
//   } catch (error) {
//     console.error('Error saving message:', error);
//     throw error;
//   }
// };
exports.saveMessage = async (sender, recipient, message) => {
  try {
    const newMessage = new Message({
      sender,
      recipient,
      message,
      // Timestamp will be added automatically by default
    });
    await newMessage.save();
    
    // Convert Mongoose document to plain object and format timestamp
    const messageObj = newMessage.toObject();
    messageObj.timestamp = newMessage.timestamp.toISOString();
    
    return messageObj;
  } catch (error) {
    console.error('Error saving message:', error);
    throw error;
  }
};

exports.getMessages = async (req, res) => {
  try {
    const messages = await Message.find({
      $or: [
        {recipient: req.params.recipient },
        { sender: req.params.recipient}
      ]
    })
    .sort('timestamp')
    .lean(); // Convert to plain JavaScript objects

    // Process messages for frontend
    const processedMessages = messages.map(msg => ({
      ...msg,
      isMe: msg.sender === req.user.username,
      timestamp: msg.timestamp.toISOString() // Convert Date to ISO string
    }));

    res.status(200).json(processedMessages);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching messages', error });
  }
};

//getexistance status that the user has a conversation with another user
// exports.getExistanceStatus = async (req, res) => {
//   try {
//     const user1 = req.params.username1;
//     // const user2 = req.params.username2;
//     const status = await Message.exists({ $or: [{ sender: user1 }, { recipient: user1 }] });
//     res.status(200).json({ exists: status });
//   } catch (error) {
//     res.status(500).json({ message: 'Error fetching messages', error });
//   }
// };


//retriving all senders and and recievers who had conservation with user
exports.getSendersAndReceivers = async (req, res) => {
  try {
    const sendersAndReceivers = await Message.find({
      $or: [
        { recipient: req.params.username },
        { sender: req.params.username }
      ]
    })
    .distinct('sender')
    .lean(); // Get distinct senders first

    const receivers = await Message.find({
      sender: req.params.username
    })
    .distinct('recipient')
    .lean(); // Get distinct recipients

    // Merge both lists and remove duplicates
    const uniqueUsers = [...new Set([...sendersAndReceivers, ...receivers])];

    res.status(200).json(uniqueUsers);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching messages', error });
  }
};
