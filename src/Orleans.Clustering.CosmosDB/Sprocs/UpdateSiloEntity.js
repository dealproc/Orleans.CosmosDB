function InsertSiloEntity(siloEntity, newVersionEntity) {
  var context = getContext();
  var collection = context.getCollection();
  var response = context.getResponse();

  var entityExistQuery = 'SELECT c.id, c._self FROM c WHERE c.id = "' + siloEntity.id + '"';
  var existAccepted = collection.queryDocuments(collection.getSelfLink(), entityExistQuery, {},
    function (err, found) {
      if (!existAccepted) throw new Error('Unable to query for SiloEntity');

      if (found.length > 0) {
        var siloFound = found.find(f => f.id === siloEntity.id);
        var versionQuery = 'SELECT * FROM c WHERE c.ClusterId = "' + newVersionEntity.ClusterId +
          '" AND c.EntityType = "ClusterVersionEntity"';

        var accept = collection.queryDocuments(collection.getSelfLink(), versionQuery, {},
          function (err, docs, responseOptions) {
            if (err) throw new Error("Error querying Version Entity: " + err.message);

            if (docs.length > 0) {
              var versionDoc = docs[0];
              if (versionDoc.ClusterVersion === newVersionEntity.ClusterVersion) {
                response.setBody(false);
              } else {
                var updateVersionRequestAccepted = collection.replaceDocument(versionDoc._self, newVersionEntity,
                  { accessCondition: { type: 'IfMatch', condition: newVersionEntity._etag } },
                  function (err, updatedVersionEntity) {
                    if (err) throw new Error('Error Updating Version Entity: ' + err.message);

                    if (!updateVersionRequestAccepted) throw new Error('Unable to write ClusterVersionEntity');

                    var siloEntityRequestAccepted = collection.replaceDocument(siloFound._self,
                      siloEntity,
                      { accessCondition: { type: 'IfMatch', condition: siloEntity._etag } },
                      function (err, siloEntityUpdated) {
                        if (err) throw new Error('Error Updating Silo Entity: ' + err.message);

                        if (!siloEntityRequestAccepted) throw new Error('Unable to write SiloEntity');

                        response.setBody(true);
                      }
                    );
                  });
              }
            } else {
              response.setBody(false);
            }
          });        
      }
      else {
        response.setBody(false);
      }
    });
}
