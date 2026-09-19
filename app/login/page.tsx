import { LoginForm } from "@/components/login-form";
import Image from "next/image";
import icon from "@/assets/icon.png";
export default async function LoginPage() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center justify-center">
          <div className="flex flex-col items-center justify-center mb-0">
            <Image
              src={icon}
              height={90}
              width={90}
              alt="AccessAbility"
              className="mx-auto mb-4"
            />
          </div>
          <div className="text-center text-2xl font-bold text-gray-900 dark:text-white">
            <h1>AccessAbility</h1>
          </div>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
