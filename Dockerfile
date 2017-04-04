FROM mhart/alpine-node:6.3

WORKDIR /src

COPY package.json /src/
RUN npm install
COPY . /src/

RUN npm run doc

CMD ["npm", "start"]
