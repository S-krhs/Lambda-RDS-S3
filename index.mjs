import { S3Client } from "@aws-sdk/client-s3";
import { Client } from 'pg';

// DB接続情報の取得
const dbConfig = {
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
};

exports.handler = async (event, context, callback) => {
  const s3 = new S3Client();
  const client = new Client(dbConfig);
  await client.connect();

  try {
    for (const record of event.Records) {
      const object = record.s3.object;
      const s3Params = {
        Bucket: object.bucket.name,
        Key: object.key,
      };
      const s3Object = await s3.getObject(s3Params).promise();

      const query = {
        text: 'INSERT INTO works (title, path) VALUES ($1, $2)',
        values: [object.key, s3Object.Location],
      };
      const result = await client.query(query);
      console.log(result);
    }
  } catch (error) {
    console.error(error);
  } finally {
    await client.end();
  }
};



