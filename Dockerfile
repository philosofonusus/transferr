FROM ubuntu:latest

WORKDIR /
COPY package*.json ./

RUN apt-get update
RUN apt-get -y install curl gnupg
RUN curl -sL https://deb.nodesource.com/setup_14.x  | bash -
RUN apt-get -y install nodejs

RUN npm install

RUN npm audit fix

RUN apt-get update && \ apt-get install -y libgtk2.0-0 libgtk-3-0 libnotify-dev \ libgconf-2-4 libnss3 libxss1 \ libasound2 libxtst6 xauth xvfb \ libgbm-dev

COPY . .

ENV PORT 5000

EXPOSE 5000

CMD ["node", "index"]