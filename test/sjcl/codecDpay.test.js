new sjcl.test.TestCase("dpay signature test vectors", function(cb) {

  var hash = sjcl.hash.sha256.hash([]);
  var self = this;

  sjcl.test.vector.dpaysig.forEach(function(fixture) {

    var secretKey = sjcl.codec.dpay.deserializePrivateKey(fixture.secretKey);
    var publicKey = sjcl.codec.dpay.deserializePublicKey(fixture.publicKey);

    fixture.signatures.forEach(function(signature) {
      var k = new sjcl.bn(signature.k);
      var r = new sjcl.bn(signature.r);
      var s = new sjcl.bn(signature.s);

      var sig = sjcl.bitArray.concat(r.toBits(256), s.toBits(256));
      publicKey.verify(hash, sig);

      var generatedSig = sjcl.codec.dpay.signRecoverably(secretKey, hash, 0, k);

      var recoveredPublicKey = sjcl.codec.dpay.recoverPublicKey(hash, generatedSig);

      publicKey.verify(hash, sjcl.bitArray.bitSlice(generatedSig, 8));

      self.require(
        fixture.publicKey === sjcl.codec.dpay.serializePublicKey(recoveredPublicKey),
        'our recovered public key is the right one'
      );

    });

  });

  cb();
});


new sjcl.test.TestCase("dpay signature core functionality", function(cb) {

  var keys = {
    sec: sjcl.codec.dpay.deserializePrivateKey("5JamTPvZyQsHf8c2pbN92F1gUY3sJkpW3ZJFzdmfbAJPAXT5aw3"),
    pub: sjcl.codec.dpay.deserializePublicKey("DWB5SKxjN1YdrFLgoPcp9KteUmNVdgE8DpTPC9sF6jbjVqP9d2Utq")
  };

  var fakehash = sjcl.hash.sha256.hash([1]);
  var sig = sjcl.codec.dpay.signRecoverably(keys.sec, fakehash, 0, new sjcl.bn(19));
  this.require(
    keys.pub.verify(fakehash, sjcl.bitArray.bitSlice(sig, 8)),
    'signature passes verification'
  );

  cb();
});

new sjcl.test.TestCase("dpay key codec tests", function (cb) {

  var testValues = [{
    username: "username",
    password: "password",
    role: "active",
    sec: "5JamTPvZyQsHf8c2pbN92F1gUY3sJkpW3ZJFzdmfbAJPAXT5aw3",
    pub: "DWB5SKxjN1YdrFLgoPcp9KteUmNVdgE8DpTPC9sF6jbjVqP9d2Utq"
  }];

  for (var i = 0; i < testValues.length; i++) {
    var testValue = testValues[i];

    var keys = sjcl.codec.dpay.keysFromPassword(
      testValue.username,
      testValue.password
    );

    var serializedSec = sjcl.codec.dpay.serializePrivateKey(keys[testValue.role].sec);
    var serializedPub = sjcl.codec.dpay.serializePublicKey(keys[testValue.role].pub);

    this.require(testValue.sec == serializedSec, 'secret key: generated ' + serializedSec + ', expected ' + testValue.sec);
    this.require(testValue.pub == serializedPub, 'public key: generated ' + serializedPub + ', expected ' + testValue.pub);

    // on deserialization we should expect to recover both points of the public key
    var deserializedPublicKey = sjcl.codec.dpay.deserializePublicKey(serializedPub);
    this.require(
      sjcl.bitArray.equal(
        deserializedPublicKey.get().x,
        keys[testValue.role].pub.get().x
      ),
      "X values of original and deserialized public keys are identical"
    );
     this.require(
      sjcl.bitArray.equal(
        deserializedPublicKey.get().y,
        keys[testValue.role].pub.get().y
      ),
      "Y values of original and deserialized public keys are identical"
    );

    // on deserialization the secret key should be the same
    var deserializedPrivateKey = sjcl.codec.dpay.deserializePrivateKey(serializedSec);
    this.require(
      sjcl.bitArray.equal(
        deserializedPrivateKey.get(),
        keys[testValue.role].sec.get()
      ),
      "original and deserialized secret keys are identical"
    );

  }

  cb();
});
