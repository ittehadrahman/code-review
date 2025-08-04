# Code Review Platform - Backend API

Backend server for the code review collection platform, built with Node.js and Express.js. This API serves the frontend application and manages data collection for thesis research on code review practices, storing data in MongoDB.

## Purpose

This backend API supports academic research by providing secure endpoints for collecting, storing, and managing code review data. It handles participant responses, code snippet management, and data export for research analysis. The platform collects reviews for predefined code snippets with a maximum review limit per snippet.

## Features

- **RESTful API**: Clean endpoints for frontend integration
- **Data Management**: Secure storage and retrieval of review data
- **Code Snippet API**: Endpoints for managing code examples
- **Review Collection**: Structured data collection from participants
- **Admin Interface**: API endpoints for research management
- **Data Export**: Endpoints for exporting collected data for analysis
- **Security**: Input validation and data protection measures

## API Endpoints

### Public Endpoints
- `GET /api/snippets` - Retrieve code snippets for review
- `POST /api/reviews` - Submit code review responses
- `GET /api/session/:id` - Get review session details

### Admin Endpoints
- `GET /api/admin/reviews` - Retrieve all collected reviews
- `POST /api/admin/snippets` - Add new code snippets
- `GET /api/admin/analytics` - Get review statistics
- `GET /api/admin/export` - Export data for analysis

### Health Check
- `GET /api/health` - Server health status

## Getting Started

### Prerequisites

- Node.js (version 18 or higher)
- npm, yarn, pnpm, or bun package manager
- Database (MongoDB/PostgreSQL/MySQL)

### Installation

1. Clone the repository:
```bash
git clone [your-backend-repository-url]
cd code-review-backend
```

2. Install dependencies:
```bash
npm install
# or
yarn install
# or
pnpm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` with your configuration:
```env
PORT=3001
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/codereview
JWT_SECRET=your_jwt_secret
CORS_ORIGIN=http://localhost:3000
```

4. Ensure MongoDB is running locally or configure your MongoDB connection string

5. Seed the database with sample code snippets:
```bash
node scripts/seedCodes.js
# or if using npm script
npm run seed
```

6. Start the development server:
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

The API will be available at [http://localhost:3001](http://localhost:3001)

## Project Structure

```
├── src/
│   ├── controllers/        # Request handlers
│   ├── models/            # Mongoose models
│   ├── routes/            # API route definitions
│   ├── middleware/        # Custom middleware
│   ├── services/          # Business logic
│   └── config/            # Configuration files
├── scripts/
│   └── seedCodes.js       # Database seeding script
├── tests/                 # Test files
└── docs/                  # API documentation
```

## Technology Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB
- **ODM**: Mongoose
- **Authentication**: JWT (if applicable)
- **Validation**: Joi/Yup/Zod
- **Testing**: Jest/Mocha
- **Documentation**: Swagger/OpenAPI

## Database Schema

### Code Snippets Collection (MongoDB)
Based on the seeding script, the Code model includes:
- `title` - Snippet title (String, required)
- `code` - Code content (String, required)
- `language` - Programming language (String, required)
- `maxReviews` - Maximum number of reviews allowed (Number, default: 3)
- `reviewCount` - Current number of reviews received (Number, default: 0)
- `isCompleted` - Whether snippet has reached max reviews (Boolean, default: false)
- `createdAt` - Timestamp (Date, default: Date.now)

### Reviews Collection
- `id` - Unique identifier
- `participant_id` - Anonymous participant identifier
- `snippet_id` - Code snippet reference (ObjectId)
- `rating` - Review rating (1-5 scale)
- `comments` - Textual feedback
- `time_spent` - Time spent on review (seconds)
- `created_at` - Timestamp

## Sample Data

The platform comes with pre-seeded code snippets including:
- **Bubble Sort Implementation** (JavaScript) - Algorithm implementation
- **Password Validation Function** (Python) - Input validation logic
- **React Component with State** (JavaScript) - Frontend component example

Each snippet is configured to collect a maximum of 3 reviews before being marked as completed.

## Data Collection

The API collects and stores:
- Anonymous review submissions
- Code snippet interaction data
- Session timing information
- Participant demographics (if consented)
- Review completion metrics

All data follows research ethics guidelines and privacy protocols.

## Security Features

- Input validation and sanitization
- Rate limiting on endpoints
- CORS configuration
- SQL injection prevention
- Data encryption at rest
- Secure session management

## Testing

Run the test suite:
```bash
npm test
# or
npm run test:watch  # Watch mode
npm run test:coverage  # Coverage report
```

## API Documentation

Access the interactive API documentation:
- Development: [http://localhost:3001/api/docs](http://localhost:3001/api/docs)
- Swagger/OpenAPI specification available at `/api/docs.json`

## Scripts

```bash
npm run dev          # Start development server
npm run start        # Start production server
npm run build        # Build for production
npm run test         # Run tests
npm run lint         # Run linter
npm run seed         # Seed database with sample code snippets
npm run db:reset     # Reset and reseed database
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `PORT` | Server port | No (default: 3001) |
| `NODE_ENV` | Environment | Yes |
| `MONGODB_URI` | MongoDB connection string | Yes |
| `JWT_SECRET` | JWT signing secret | Yes |
| `CORS_ORIGIN` | Frontend URL | Yes |

## Deployment

### Production Setup
1. Set production environment variables
2. Build the application: `npm run build`
3. Start with: `npm start`

### Docker Deployment
```bash
docker build -t code-review-backend .
docker run -p 3001:3001 --env-file .env code-review-backend
```

### Cloud Platforms
- **Heroku**: Use the included Procfile
- **AWS/Azure**: Configure with container services
- **DigitalOcean**: App Platform compatible

## Research Ethics & Compliance

- GDPR/Privacy compliance for data collection
- Participant anonymization protocols
- Secure data storage and transmission
- Data retention and deletion policies
- IRB approval documentation

## Monitoring & Logging

- Request/response logging
- Error tracking and reporting
- Performance monitoring
- Database query optimization
- Health check endpoints

## Contributing

This is a research project. For contributions:
1. Follow the existing code style
2. Add tests for new features
3. Update API documentation
4. Ensure security best practices

## Research Data Export

Export collected data for analysis:
```bash
npm run export:csv    # Export to CSV format
npm run export:json   # Export to JSON format
npm run export:stats  # Generate statistics report
```

## Contact

For technical questions or research inquiries:
- **Researcher**: [Your Name]
- **Institution**: [Your Institution]
- **Email**: [Your Email]
- **Thesis Supervisor**: [Supervisor Name and Contact]

## License

This project is for academic research purposes. Contact the research team for usage permissions.

## Acknowledgments

- Built with Node.js and Express.js
- Database design optimized for research data collection
- Security practices following industry standards
- Thanks to the academic community for research guidance
