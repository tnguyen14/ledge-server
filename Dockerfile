FROM mhart/alpine-node:6.11

# dependencies needed to build leveldown
RUN apk add --no-cache python make gcc g++

WORKDIR /src

COPY package.json /src/
RUN npm install
COPY . /src/

RUN npm run doc

CMD ["npm", "start"]
