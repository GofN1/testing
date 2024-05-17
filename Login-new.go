func buildSignatureforPayment(user string, amount int) (string){
  mac := hmac.New(sha256.New, []byte(key))
  mac.Write([]byte(user+strconv.Itoa(amount)))
  return hex.EncodeToString(mac.Sum(nil))
}

func buildUrl(user string, amount int, sign string) (string) {
  ret := base_url+"?user="+user
  ret+= "&amount="+strconv.Itoa(amount)
  ret+="&sign="+sign
  return ret
}

func verifyPayment(user string, amount int, sign string) (bool) {
  mac := hmac.New(sha256.New, []byte(key))
  mac.Write([]byte(user+strconv.Itoa(amount)))
  expected := mac.Sum(nil)
  provided, err := hex.DecodeString(sign)
  if err != nil {
    return false
  }
  return hmac.Equal(expected, provided)
}
