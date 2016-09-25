FROM mhart/alpine-node:6.3

WORKDIR /src

COPY package.json /src/
RUN npm install
COPY . /src/

CMD ["npm", "start"]
