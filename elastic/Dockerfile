FROM elasticsearch:7.10.1

#RUN echo "vm.max_map_count=262144" >> /etc/sysctl.d/10-elasticsearch.conf
RUN cd /usr/share/elasticsearch/
RUN bin/elasticsearch-plugin install analysis-phonetic
RUN bin/elasticsearch-plugin install analysis-icu