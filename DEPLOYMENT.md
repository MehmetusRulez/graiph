# Deployment Guide for Graiph

This guide covers deploying Graiph to production environments.

## Architecture Overview

Graiph consists of two services:
1. **Next.js Frontend** - Handles UI, OpenAI API calls, data profiling
2. **Python Backend** - Generates charts using Matplotlib

Both need to be deployed separately and configured to communicate.

---

## Option 1: Vercel (Frontend) + Railway (Backend)

### Frontend Deployment (Vercel)

1. **Push to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/yourusername/graiph.git
   git push -u origin main
   ```

2. **Deploy to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Configure environment variables:
     - `OPENAI_API_KEY`: Your OpenAI API key
   - Deploy!

3. **Note the frontend URL** (e.g., `https://graiph.vercel.app`)

### Backend Deployment (Railway)

1. **Create `Procfile`** in `python-backend/`:
   ```
   web: gunicorn -w 4 -b 0.0.0.0:$PORT app:app
   ```

2. **Update `requirements.txt`** to include Gunicorn:
   ```
   gunicorn==21.2.0
   ```

3. **Deploy to Railway**
   - Go to [railway.app](https://railway.app)
   - Create new project from GitHub repo
   - Select `python-backend` directory
   - Set environment variable:
     - `PORT`: 5001 (or let Railway auto-assign)
   - Deploy!

4. **Update Frontend with Backend URL**
   - In Vercel environment variables, add:
     - `NEXT_PUBLIC_BACKEND_URL`: Your Railway URL (e.g., `https://graiph-backend.railway.app`)
   - Update `src/app/api/generate-dashboard/route.ts`:
     ```typescript
     const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5001';
     const pythonResponse = await fetch(`${backendUrl}/generate-graphs`, {
       // ...
     });
     ```

---

## Option 2: AWS (Full Stack)

### Frontend (AWS Amplify)

1. **Build Configuration**
   Create `amplify.yml`:
   ```yaml
   version: 1
   frontend:
     phases:
       preBuild:
         commands:
           - npm install
       build:
         commands:
           - npm run build
     artifacts:
       baseDirectory: .next
       files:
         - '**/*'
     cache:
       paths:
         - node_modules/**/*
   ```

2. **Deploy**
   - Connect GitHub repo to AWS Amplify
   - Add environment variables in Amplify Console
   - Deploy

### Backend (AWS Elastic Beanstalk)

1. **Install EB CLI**
   ```bash
   pip install awsebcli
   ```

2. **Initialize EB**
   ```bash
   cd python-backend
   eb init -p python-3.11 graiph-backend
   ```

3. **Create Environment**
   ```bash
   eb create graiph-backend-env
   ```

4. **Deploy**
   ```bash
   eb deploy
   ```

---

## Option 3: Docker (Self-Hosted)

### Create Docker Files

**Frontend Dockerfile:**
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

**Backend Dockerfile:**
```dockerfile
FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 5001

CMD ["gunicorn", "-w", "4", "-b", "0.0.0.0:5001", "app:app"]
```

**docker-compose.yml:**
```yaml
version: '3.8'

services:
  frontend:
    build: .
    ports:
      - "3000:3000"
    environment:
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - NEXT_PUBLIC_BACKEND_URL=http://backend:5001
    depends_on:
      - backend

  backend:
    build: ./python-backend
    ports:
      - "5001:5001"
```

**Deploy:**
```bash
docker-compose up -d
```

---

## Environment Variables

### Frontend (.env.local / Vercel Environment Variables)
```bash
OPENAI_API_KEY=sk-...
NEXT_PUBLIC_BACKEND_URL=https://your-backend-url.com
```

### Backend (Railway / EB Environment Variables)
```bash
PORT=5001
FLASK_ENV=production
```

---

## Performance Optimization

### Frontend
- Enable Next.js caching
- Use CDN for static assets (Vercel does this automatically)
- Optimize images

### Backend
- Use Gunicorn with multiple workers
- Enable response compression
- Add Redis caching for data profiles
- Consider using async workers (Celery)

---

## Monitoring

### Frontend (Vercel)
- Built-in analytics
- Error tracking with Sentry

### Backend
- Use Railway logs
- Add application monitoring (New Relic, Datadog)
- Set up health check endpoint

---

## Security Checklist

- [ ] Use HTTPS for all endpoints
- [ ] Validate and sanitize all CSV inputs
- [ ] Set rate limits on API endpoints
- [ ] Rotate OpenAI API keys regularly
- [ ] Use environment variables (never commit secrets)
- [ ] Enable CORS only for your frontend domain
- [ ] Set up firewall rules
- [ ] Regular dependency updates

---

## Scaling Considerations

### For High Traffic
1. **Frontend**: Vercel auto-scales
2. **Backend**:
   - Horizontal scaling (multiple instances)
   - Queue system for chart generation (Redis + Celery)
   - Separate OpenAI API calls from chart generation

### For Large Datasets
- Stream CSV processing instead of loading entire file
- Implement pagination for large datasets
- Add background job processing

---

## Cost Estimates

### Vercel
- Hobby: Free (limited builds)
- Pro: $20/month

### Railway
- Hobby: $5/month
- Pro: $20/month

### OpenAI API
- Varies by usage
- ~$0.01-0.05 per dashboard generation
- Expect $10-50/month for moderate use

**Total**: ~$25-75/month for production-ready setup

---

## Troubleshooting

**Backend not reachable from Frontend:**
- Check CORS settings in `python-backend/app.py`
- Verify `NEXT_PUBLIC_BACKEND_URL` is correct
- Ensure backend is running and healthy

**OpenAI Rate Limits:**
- Implement request queuing
- Add retry logic with exponential backoff
- Consider caching AI responses for similar requests

**Chart Generation Timeout:**
- Increase timeout in fetch call
- Add loading indicators
- Consider WebSocket for real-time updates

---

## Need Help?

- Check GitHub Issues
- Read the main README
- Open a new issue with deployment questions
