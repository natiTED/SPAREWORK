import createError from "../utils/createError.js";
import Conversation from "../models/conversation.model.js";
import User from "../models/user.model.js";

export const createConversation = async (req, res, next) => {
  const newConversation = new Conversation({
    id: req.isSeller ? req.userId + req.body.to : req.body.to + req.userId,
    sellerId: req.isSeller ? req.userId : req.body.to,
    buyerId: req.isSeller ? req.body.to : req.userId,
    readBySeller: req.isSeller,
    readByBuyer: !req.isSeller,
  });

  try {
    const savedConversation = await newConversation.save();
    res.status(201).send(savedConversation);
  } catch (err) {
    next(err);
  }
};

export const updateConversation = async (req, res, next) => {
  try {
    const updatedConversation = await Conversation.findOneAndUpdate(
      { id: req.params.id },
      {
        $set: {
          // readBySeller: true,
          // readByBuyer: true,
          ...(req.isSeller ? { readBySeller: true } : { readByBuyer: true }),
        },
      },
      { new: true }
    );

    res.status(200).send(updatedConversation);
  } catch (err) {
    next(err);
  }
};

// export const getSingleConversation = async (req, res, next) => {
//   try {
//     const conversation = await Conversation.findOne({ id: req.params.id });
//     if (!conversation) return next(createError(404, "Not found!"));
//     res.status(200).send(conversation);
//   } catch (err) {
//     next(err);
//   }
// };

export const getSingleConversation = async (req, res, next) => {
  try {
    const conversation = await Conversation.findOne({ id: req.params.id });
    if (!conversation) return next(createError(404, "Conversation not found!"));

    try {
      // Fetch the buyer and seller details
      const buyer = await User.findById(conversation.buyerId);
      const seller = await User.findById(conversation.sellerId);

      // Add buyerName and sellerName directly to the conversation object
      conversation._doc.buyerName = buyer?.username || "Unknown Buyer";
      conversation._doc.sellerName = seller?.username || "Unknown Seller";

      res.status(200).send(conversation);
    } catch (err) {
      console.error("Error fetching user data:", err);
      next(createError(500, "Error fetching user details"));
    }
  } catch (err) {
    console.error("Error in getSingleConversation:", err);
    next(err);
  }
};

// export const getConversations = async (req, res, next) => {
//   try {
//     const conversations = await Conversation.find(
//       req.isSeller ? { sellerId: req.userId } : { buyerId: req.userId }
//     ).sort({ updatedAt: -1 });
//     res.status(200).send(conversations);
//   } catch (err) {
//     next(err);
//   }
// };

export const getConversations = async (req, res, next) => {
  try {
    // Find conversations based on whether the user is a seller or buyer
    const conversations = await Conversation.find(
      req.isSeller ? { sellerId: req.userId } : { buyerId: req.userId }
    ).sort({ updatedAt: -1 });

    // Manually find the buyer and seller names for each conversation
    await Promise.all(
      conversations.map(async (conversation) => {
        try {
          // Fetch the buyer and seller information
          const buyer = await User.findById(conversation.buyerId);
          const seller = await User.findById(conversation.sellerId);

          // Add buyerName and sellerName directly to each conversation object
          conversation._doc.buyerName = buyer?.username || "Unknown Buyer";
          conversation._doc.sellerName = seller?.username || "Unknown Seller";
        } catch (err) {
          console.error("Error fetching user data:", err);
          // Default to "Unknown Buyer/Seller" if there is an error
          conversation._doc.buyerName = "Unknown Buyer";
          conversation._doc.sellerName = "Unknown Seller";
        }
      })
    );

    res.status(200).send(conversations);
  } catch (err) {
    console.error("Error in getConversations:", err);
    next(err);
  }
};
