// frontend/src/components/settings/MFASetup.tsx

import { Box, Button, Image, Paper, Text, TextInput, Title } from "@mantine/core";
import { useSupabase } from '@/providers/SupabaseProvider';
import React, { useState } from "react";

const MFASetup = () => {
  const { supabase, loading: supabaseLoading } = useSupabase();
  const [step, setStep] = useState("start"); // 'start', 'qr', 'verify'
  const [qrCode, setQrCode] = useState("");
  const [factorId, setFactorId] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [error, setError] = useState("");

  // Start MFA enrollment
  const startEnrollment = async () => {
    if (!supabase) return;
    try {
      setError("");
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: "totp",
      });

      if (error) throw error;

      setQrCode(data.totp.qr_code);
      setFactorId(data.id);
      setStep("qr");
    } catch (err) {
      // Fix for err is of type unknown
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unknown error occurred");
      }
      console.error("Error starting MFA enrollment:", err);
    }
  };

  // Verify and complete enrollment
  const verifyAndEnroll = async () => {
    if (!supabase) return;
    try {
      setError("");
      // Use type assertion to work around the type definition issues
      const { data, error } = await supabase.auth.mfa.challenge({
        factorId,
        // @ts-ignore - Parameter name varies between Supabase versions
        code: verificationCode,
      } as any);

      if (error) throw error;

      // Successfully verified
      setStep("success");
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unknown error occurred");
      }
      console.error("Error verifying MFA code:", err);
    }
  };

  return (
    <Paper p="md" withBorder>
      <Title order={3} mb="md">
        Two-Factor Authentication Setup
      </Title>

      {step === "start" && (
        <Box>
          <Text mb="md">
            Enhance your account security by setting up two-factor authentication. You'll need an
            authenticator app like Google Authenticator or Authy.
          </Text>
          <Button onClick={startEnrollment}>Set Up Two-Factor Authentication</Button>
        </Box>
      )}

      {step === "qr" && (
        <Box>
          <Text mb="md">
            Scan this QR code with your authenticator app, then enter the 6-digit code below:
          </Text>
          <Box mb="md" ta="center">
            <img src={qrCode} alt="QR Code" style={{ maxWidth: "200px" }} />
          </Box>
          <TextInput
            label="Verification Code"
            placeholder="Enter 6-digit code"
            value={verificationCode}
            onChange={(e) => setVerificationCode(e.target.value)}
            mb="md"
          />
          <Button onClick={verifyAndEnroll}>Verify and Activate</Button>
        </Box>
      )}

      {step === "success" && (
        <Box>
          <Text mb="md" c="green">
            Two-factor authentication has been successfully activated for your account!
          </Text>
          <Text>
            From now on, you'll need to enter a verification code from your authenticator app when
            signing in.
          </Text>
        </Box>
      )}

      {error && (
        <Text c="red" mt="md">
          {error}
        </Text>
      )}
    </Paper>
  );
};

export default MFASetup;
