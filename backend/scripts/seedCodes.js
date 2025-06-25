const mongoose = require("mongoose");
require("dotenv").config();

const CodeSchema = new mongoose.Schema({
  title: { type: String, required: true },
  code: { type: String, required: true },
  language: { type: String, required: true },
  maxReviews: { type: Number, default: 3 },
  reviewCount: { type: Number, default: 0 },
  isCompleted: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

const Code = mongoose.model("Code", CodeSchema);

// Sample codes for testing - replace with your extracted codes
const sampleCodes = [
  {
    title: "Bubble Sort Implementation",
    language: "JavaScript",
    code: `function bubbleSort(arr) {
    for (let i = 0; i < arr.length; i++) {
        for (let j = 0; j < arr.length - i - 1; j++) {
            if (arr[j] > arr[j + 1]) {
                let temp = arr[j];
                arr[j] = arr[j + 1];
                arr[j + 1] = temp;
            }
        }
    }
    return arr;
}

console.log(bubbleSort([64, 34, 25, 12, 22, 11, 90]));`,
    maxReviews: 3,
  },
  {
    title: "Password Validation Function",
    language: "Python",
    code: `def validate_password(password):
    if len(password) < 8:
        return False
    
    has_upper = False
    has_lower = False
    has_digit = False
    
    for char in password:
        if char.isupper():
            has_upper = True
        elif char.islower():
            has_lower = True
        elif char.isdigit():
            has_digit = True
    
    return has_upper and has_lower and has_digit

# Test
print(validate_password("MyPassword123"))`,
    maxReviews: 3,
  },
  {
    title: "React Component with State",
    language: "JavaScript",
    code: `import React, { useState } from 'react';

function Counter() {
    const [count, setCount] = useState(0);
    
    const increment = () => {
        setCount(count + 1);
    };
    
    const decrement = () => {
        setCount(count - 1);
    };
    
    return (
        <div>
            <h2>Count: {count}</h2>
            <button onClick={increment}>+</button>
            <button onClick={decrement}>-</button>
        </div>
    );
}

export default Counter;`,
    maxReviews: 3,
  },
];

async function seedDatabase() {
  try {
    await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://localhost:27017/codereview"
    );
    console.log("Connected to MongoDB");

    // Clear existing codes
    await Code.deleteMany({});
    console.log("Cleared existing codes");

    // Insert sample codes
    const insertedCodes = await Code.insertMany(sampleCodes);
    console.log(`Inserted ${insertedCodes.length} sample codes`);

    console.log("Database seeded successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding database:", error);
    process.exit(1);
  }
}

if (require.main === module) {
  seedDatabase();
}

module.exports = { seedDatabase };
