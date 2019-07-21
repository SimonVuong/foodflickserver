import elasticsearch from 'elasticsearch';
// The index operation automatically creates an index if it has not been created before so we don't need to 
// explicitly create an index. putting docs into a non-existent index will create it.
// see https://www.elastic.co/guide/en/elasticsearch/reference/current/docs-index_.html#index-creation

let elastic;

export const getElastic = async () => {
  if (elastic) return elastic;
  
  elastic = new elasticsearch.Client({
    host: 'localhost:9200',
    log: 'warning'
  });

  return elastic;
};