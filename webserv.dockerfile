# Веб сервер NGINX-UNIT
FROM unit:python3.12

#-- frontend
COPY ./frontend/ /frontend
RUN apt update && apt install -y npm &&\
groupadd -g 1500 bother &&\
useradd -u 1500 -g bother -m -s /bin/bash bother 
RUN cd /frontend && npm install && npm run build

#-- backend
COPY ./backend/requirements.txt /requirements.txt

RUN python3 -m venv /backend/venv
RUN . /backend/venv/bin/activate && pip install --upgrade pip && pip install -r /requirements.txt
RUN chmod +x /backend/venv/bin/python

COPY ./backend /backend
COPY webserv.json /docker-entrypoint.d/config.json

