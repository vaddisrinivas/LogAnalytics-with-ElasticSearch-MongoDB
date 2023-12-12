# Use the official Python image as the base image
FROM python:3.11

# Set the working directory to /backend
WORKDIR /app

# Copy the requirements.txt file to the container
COPY requirements.txt .

# Install the dependencies
RUN pip install -r requirements.txt

# Copy the rest of the code to the container
COPY . .

# Expose the port 5000
EXPOSE 3000

RUN ls -lart
# RUN python tests/testcases.py
# Run the backend
CMD ["python","app.py"]
