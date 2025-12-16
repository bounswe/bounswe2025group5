# Page snapshot

```yaml
- generic [ref=e3]:
  - navigation [ref=e5]:
    - button "WasteLess application logo" [ref=e7] [cursor=pointer]
    - generic [ref=e8]:
      - button "Main" [ref=e9]
      - button "Feed" [ref=e10]
      - button "Sign Up" [ref=e11]
  - button "Dili Türkçe'ye değiştir" [ref=e13]:
    - img "Türk bayrağı" [ref=e14]
  - main [ref=e15]:
    - generic [ref=e18]:
      - generic [ref=e19]:
        - generic [ref=e20]: Login to your account
        - generic [ref=e21]: Enter your email below to login to your account
        - button "Sign Up" [ref=e23]
      - generic [ref=e26]:
        - generic [ref=e27]:
          - generic [ref=e28]: Email / Username
          - textbox "Email / Username" [ref=e29]:
            - /placeholder: m@example.com
        - generic [ref=e30]:
          - generic [ref=e31]:
            - generic [ref=e32]: Password
            - link "Forgot your password?" [ref=e33] [cursor=pointer]:
              - /url: "#"
          - textbox "Password" [ref=e34]
      - button "Login" [ref=e36]
    - region "Notifications alt+T"
```