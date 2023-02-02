# Ingestion for Sheets

This is an addon for google sheets that allows you to ingest data from the sheets into an api endpoint.

It works simply by installing the addon on the document, and setting the endpoint and custom headers to send.

It'll accumulate changes into a queue, and send them to the endpoint in batches every hour.

You can see the list of changes that are queued up in the addon menu.

Every day it'll pack all sheets into a single json object, and send it to the endpoint to ensure that you have a full copy of the data.