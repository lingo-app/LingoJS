FROM node:10

LABEL "version"="1.0.0"
LABEL "repository"="https://github.com/lingo-app/develper-docs"
LABEL "homepage"="https://github.com/lingo-app/developer-docs"
LABEL "maintainer"="Lingo <info@lingoapp.com>"

LABEL "com.github.actions.name"="GitHub Action for prettier"
LABEL "com.github.actions.description"="Validate the code formatting with prettier."
LABEL "com.github.actions.icon"="align-left"
LABEL "com.github.actions.color"="yellow"

RUN npm install --global prettier

ADD entrypoint.sh /entrypoint.sh
ENTRYPOINT ["/entrypoint.sh"]

CMD [ "" ]