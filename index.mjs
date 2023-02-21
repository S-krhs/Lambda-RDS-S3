import { S3Client } from "@aws-sdk/client-s3"
import pg from 'pg'

// DB接続情報の取得
const dbConfig = {
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
};


const handler = async (event, context, callback) => {
  const s3 = new S3Client();
  const client = new pg.Client(dbConfig);
  await client.connect();

  try {
    for (const record of event.Records) {
      
      let query;
      
      if(record.eventName.startsWith("ObjectCreated:")){
        query = {
          text: 'INSERT INTO works (timestamp, path) VALUES ($1, $2)',
          values: [record.eventTime , record.s3.object.key],
        };
      }else if(record.eventName.startsWith("ObjectRemoved:")){
        query = {
          text: 'DELETE FROM works WHERE path = $1',
          values: [record.s3.object.key],
        };
      }else{
        throw("UnexpectedObjectError:",record.eventName);
      }
      
      const result = await client.query(query);
      console.log(result);
    }
  } catch (error) {
    console.error(error);
  } finally {
    await client.end();
  }
};

export{handler};